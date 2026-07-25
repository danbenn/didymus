#!/usr/bin/env python3
"""
Extracts text (and embedded images) from each attached PDF and appends a
"Full Text" section to the corresponding src/pages/*.md page, so the PDF's
content is indexable HTML rather than locked inside a binary download.

Run: python3 scripts/extract_pdfs.py
"""
import hashlib
import re
import sys
from collections import defaultdict
from pathlib import Path

import fitz  # PyMuPDF
import frontmatter

ROOT = Path(__file__).resolve().parent.parent
PAGES_DIR = ROOT / "src" / "pages"
UPLOADS_DIR = ROOT / "www.didymus.org" / "uploads" / "3" / "4" / "2" / "1" / "3421357"
IMG_OUT_ROOT = ROOT / "src" / "img" / "pdfs"

BULLET_RE = re.compile(r"^[••●▪‣o]\s+")

# These PDFs have enough Greek text that PyMuPDF's plain-text extraction
# mangles word order/diacritics (the underlying PDFs place accented Greek
# glyphs as separate positioned text runs). They're transcribed by hand
# instead of through this script — see scripts/greek_pdfs.md.
GREEK_HEAVY_EXCLUDE = {
    "envy.pdf",
    "prayer_and_spirituality_syllabus_2018.pdf",
    "prayer_in_the_early_church.pdf",
    "introduction_to_biblical_teaching_on_prayer.pdf",
    "augustine_confessions_vi-vii.pdf",
    "spiritual_gifts_nt_passages.pdf",
    "evagrius_life_summary_eight_evil_reasonings.pdf",
    "give_us_this_day_our_daily_bread.pdf",
    "pride.pdf",
    "origen_on_prayer.pdf",
    "vainglory.pdf",
    "women_and_ministry_in_the_early_church.pdf",
}


def clean_paragraphs(page_text):
    """Reflow PyMuPDF's line-wrapped raw text into real paragraphs/list items."""
    raw_lines = [ln.strip() for ln in page_text.split("\n")]
    # Split into chunks separated by blank lines.
    chunks, current = [], []
    for ln in raw_lines:
        if ln == "":
            if current:
                chunks.append(current)
                current = []
        else:
            current.append(ln)
    if current:
        chunks.append(current)

    paragraphs = []
    for chunk in chunks:
        items = []  # list of joined strings (paragraph or bullet items)
        buf = None
        is_list = False
        for ln in chunk:
            if BULLET_RE.match(ln):
                if buf is not None:
                    items.append(buf)
                buf = "- " + BULLET_RE.sub("", ln)
                is_list = True
            elif buf is None:
                buf = ln
            else:
                buf = buf + " " + ln
        if buf is not None:
            items.append(buf)
        paragraphs.append("\n".join(items) if is_list else " ".join(items))

    return "\n\n".join(paragraphs).strip()


def scan_corpus_image_hashes(pdf_paths):
    """Pre-scan every PDF's embedded images so repeated stock-art (decorative
    borders/crosses reused across dozens of unrelated documents) can be
    dropped, keeping only images that are unique to a single document."""
    hash_to_pdfs = defaultdict(set)
    for pdf_path in pdf_paths:
        try:
            doc = fitz.open(pdf_path)
        except Exception:
            continue
        for xref in {img[0] for page in doc for img in page.get_images()}:
            try:
                data = doc.extract_image(xref)["image"]
            except Exception:
                continue
            h = hashlib.sha1(data).hexdigest()
            hash_to_pdfs[h].add(pdf_path.name)
        doc.close()
    return {h for h, pdfs in hash_to_pdfs.items() if len(pdfs) > 1}


def extract_images(doc, out_dir, slug, decorative_hashes):
    saved = []
    seen_xrefs = set()
    for page_index in range(doc.page_count):
        page = doc[page_index]
        for img in page.get_images():
            xref = img[0]
            if xref in seen_xrefs:
                continue
            seen_xrefs.add(xref)
            # Repeated in the same spot many times => a tiled fill pattern
            # (e.g. hatching inside a chart), not a standalone figure.
            if len(page.get_image_rects(xref)) > 2:
                continue
            try:
                base = doc.extract_image(xref)
            except Exception:
                continue
            ext = base["ext"]
            w, h = base.get("width", 0), base.get("height", 0)
            if w < 100 or h < 100:
                continue  # skip tiny icons/bullets/decorative artifacts
            if hashlib.sha1(base["image"]).hexdigest() in decorative_hashes:
                continue  # reused stock decoration, not real content
            out_dir.mkdir(parents=True, exist_ok=True)
            fname = f"{slug}-p{page_index + 1}-{len(saved) + 1}.{ext}"
            (out_dir / fname).write_bytes(base["image"])
            saved.append({"file": fname, "page": page_index + 1})
    return saved


def slugify_pdf(name):
    return re.sub(r"[^a-z0-9]+", "-", Path(name).stem.lower()).strip("-")


def main():
    pages = sorted(PAGES_DIR.glob("*.md"))
    stats = {"processed": 0, "no_attachments": 0, "missing_pdf": 0, "images": 0, "errors": []}

    all_pdfs = sorted(UPLOADS_DIR.glob("*.pdf"))
    print(f"Pre-scanning {len(all_pdfs)} PDFs for repeated decorative art...")
    decorative_hashes = scan_corpus_image_hashes(all_pdfs)
    print(f"Found {len(decorative_hashes)} reused-image hashes to exclude.")

    for page_path in pages:
        post = frontmatter.load(page_path)
        attachments = post.get("attachments") or []
        pdf_attachments = [a for a in attachments if a.get("file", "").lower().endswith(".pdf")]
        if not pdf_attachments:
            stats["no_attachments"] += 1
            continue

        sections = []
        for att in pdf_attachments:
            if att["file"] in GREEK_HEAVY_EXCLUDE:
                stats.setdefault("skipped_greek", []).append((page_path.name, att["file"]))
                continue
            pdf_path = UPLOADS_DIR / att["file"]
            if not pdf_path.exists():
                stats["missing_pdf"] += 1
                print(f"MISSING PDF: {pdf_path} (referenced by {page_path.name})")
                continue

            try:
                doc = fitz.open(pdf_path)
            except Exception as e:
                stats["errors"].append((page_path.name, att["file"], str(e)))
                continue

            pdf_slug = slugify_pdf(att["file"])
            page_texts = [clean_paragraphs(p.get_text()) for p in doc]
            body = "\n\n".join(t for t in page_texts if t)

            img_dir = IMG_OUT_ROOT / post["slug"]
            images = extract_images(doc, img_dir, pdf_slug, decorative_hashes)
            stats["images"] += len(images)
            doc.close()

            heading = f"### {Path(att['file']).stem.replace('_', ' ').replace('-', ' ').title()}"
            image_md = "\n\n".join(
                f"![Figure from {att['file']}, page {img['page']}](/img/pdfs/{post['slug']}/{img['file']})"
                for img in images
            )
            section = heading + "\n\n" + body
            if image_md:
                section += "\n\n" + image_md
            sections.append(section)

        if not sections:
            continue

        content = post.content.rstrip()
        marker = "\n\n<!-- pdf-fulltext -->\n\n"
        if "<!-- pdf-fulltext -->" in content:
            content = content.split("<!-- pdf-fulltext -->")[0].rstrip()
        new_content = content + marker + "## Full Text\n\n" + "\n\n---\n\n".join(sections)
        post.content = new_content

        with open(page_path, "w", encoding="utf-8") as f:
            f.write(frontmatter.dumps(post))
            f.write("\n")
        stats["processed"] += 1

    print("\n--- Summary ---")
    print(f"Pages with PDF attachments processed: {stats['processed']}")
    print(f"Pages with no attachments: {stats['no_attachments']}")
    print(f"Missing PDF files: {stats['missing_pdf']}")
    print(f"Images extracted: {stats['images']}")
    if stats["errors"]:
        print(f"Errors: {len(stats['errors'])}")
        for e in stats["errors"][:10]:
            print("  ", e)
    skipped = stats.get("skipped_greek", [])
    if skipped:
        print(f"Skipped (Greek-heavy, needs manual transcription): {len(skipped)}")
        for s in skipped:
            print("  ", s)


if __name__ == "__main__":
    sys.exit(main())
