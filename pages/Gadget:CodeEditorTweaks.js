// <nowiki>
$(function() {
  "use strict";

  mw.hook("codeEditor.configure").add(function(editSession) {
    if (mw.config.get("wgNamespaceNumber") != 2302) {
      // See https://ace.c9.io/api/edit_session.html
      editSession.setTabSize(2);
      editSession.setUseSoftTabs(true);
    }
  });
});
// </nowiki>
