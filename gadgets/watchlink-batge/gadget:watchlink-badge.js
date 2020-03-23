// <nowiki>
(function() {
  new mw.Api()
    .get({
      action: "query",
      format: "json",
      titles: mw.config.get("wgPageName"),
      prop: "info",
      inprop: "watchers"
    })
    .done(function(data) {
      var pages = data.query.pages;
      var watchers;
      for (var p in data.query.pages) {
        watchers = pages[p].watchers;
      }
      if (watchers === 0) {
        return;
      }

      var $badge = document.createElement("div");
      $badge.className = "fw-watchlink-badge";
      $badge.innerText = watchers;
      var watchlink = document.querySelector(".mw-watchlink");
      watchlink.parentElement.insertBefore($badge, watchlink);
    });
})();
// </nowiki>
