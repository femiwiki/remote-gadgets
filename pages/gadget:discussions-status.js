(function() {
  var title = new mw.Title(mw.config.get("wgPageName"));
  var namespace = title.getNamespacePrefix();
  var talkName =
    namespace.substring(0, namespace.length - 1) + "토론:" + title.getMain();

  function openTopicExists() {
    var skin = mw.config.get("skin");
    var $talk = $("#ca-talk");

    $talk.addClass("hasOpenTopic");
  }

  var api = new mw.Api();
  api
    .get({
      action: "flow",
      page: talkName,
      submodule: "view-topiclist"
    })
    .done(function(data) {
      var topiclist = data.flow["view-topiclist"]["result"]["topiclist"];
      var roots = topiclist["roots"];
      var revisions = topiclist["revisions"];

      var locked = 0;
      for (key in revisions) {
        if (revisions[key]["changeType"] == "lock-topic") locked++;
      }

      if (locked != roots.length) openTopicExists();
    });
})();
