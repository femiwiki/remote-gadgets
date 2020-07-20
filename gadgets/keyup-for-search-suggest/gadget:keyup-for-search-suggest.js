// <nowiki>
// Issue: https://github.com/femiwiki/mediawiki/issues/275
'use strict';

var $input = $('#searchInput');
$input.keyup(function (e) {
  switch (e.key) {
    case 'ArrowUp':
    case 'ArrowRight':
    case 'ArrowDown':
    case 'ArrowLeft':
      return;
  }
  $input.trigger('keypress');
});
// </nowiki>
