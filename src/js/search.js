(function () {
  var container = document.querySelector(".site-search");
  if (!container) return;
  var baseUrl = container.getAttribute("data-base-url") || "";
  var input = document.getElementById("site-search-input");
  var results = document.getElementById("site-search-results");
  var index = null;

  function loadIndex() {
    if (index) return Promise.resolve(index);
    return fetch(baseUrl + "/search-index.json")
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; return data; });
  }

  function excerpt(content, query) {
    var i = content.toLowerCase().indexOf(query.toLowerCase());
    if (i === -1) return content.slice(0, 100);
    var start = Math.max(0, i - 40);
    return (start > 0 ? "…" : "") + content.slice(start, i + 80) + "…";
  }

  function render(matches, query) {
    results.innerHTML = "";
    if (matches.length === 0) {
      results.hidden = true;
      return;
    }
    matches.slice(0, 15).forEach(function (m) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = baseUrl + m.url;
      a.textContent = m.title;
      li.appendChild(a);
      if (m.matchedContent) {
        var p = document.createElement("p");
        p.className = "site-search-excerpt";
        p.textContent = excerpt(m.content, query);
        li.appendChild(p);
      }
      results.appendChild(li);
    });
    results.hidden = false;
  }

  function search(query) {
    query = query.trim();
    if (query.length < 2) {
      results.hidden = true;
      results.innerHTML = "";
      return;
    }
    loadIndex().then(function (data) {
      var q = query.toLowerCase();
      var titleMatches = [];
      var contentMatches = [];
      data.forEach(function (item) {
        if (item.title.toLowerCase().indexOf(q) !== -1) {
          titleMatches.push(item);
        } else if (item.content && item.content.toLowerCase().indexOf(q) !== -1) {
          contentMatches.push(Object.assign({ matchedContent: true }, item));
        }
      });
      render(titleMatches.concat(contentMatches), query);
    });
  }

  var debounceTimer;
  input.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    var value = input.value;
    debounceTimer = setTimeout(function () { search(value); }, 120);
  });

  document.addEventListener("click", function (e) {
    if (!container.contains(e.target)) {
      results.hidden = true;
    }
  });
})();
