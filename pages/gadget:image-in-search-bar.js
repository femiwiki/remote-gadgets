// <nowiki>
(function() {
  "use strict";

  var today = new Date();

  if (today.getMonth() == 2 || today.getDate() != 8) {
    return;
  }

  var icon = document.createElement("div");
  icon.id = "anniversary-icon";
  icon.innerHTML = "🥖🌹";
  document.getElementById("p-search").appendChild(icon);
})();
// </nowiki>
