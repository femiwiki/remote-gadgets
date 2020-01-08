// <nowiki>
// Issue: https://github.com/femiwiki/mediawiki/issues/275
"use strict";

var $input = $("#searchInput"),
  context = $input.data("suggestions-context");

if (context !== undefined || context !== null) {
  $input.keyup(function(e) {
    switch (e.key) {
      case "ArrowUp":
      case "ArrowRight":
      case "ArrowDown":
      case "ArrowLeft":
        return;
    }
    $.suggestions.keypress(e, context, context.data.keypressed);
  });
}
// </nowiki>
