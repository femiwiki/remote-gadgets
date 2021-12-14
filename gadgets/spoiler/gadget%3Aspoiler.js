// <nowiki>
/**
 * [[틀:스포일러]] 를 보조합니다
 */
(function () {
  'use strict';

  var $noticeTexts = $('.spoiler-notice-text');
  var $spoilerTexts = $('.spoiler-text');
  var $hasSpoilingHeadings = !!$spoilerTexts.has('h1,h2,h3,h4,h5,h6').length;

  if ($noticeTexts.length === 0 || $spoilerTexts.length === 0) return;

  if ($hasSpoilingHeadings) {
    var $toc = $('#toc, .toc').hide();
  }
  $('.spoiler-js').show();

  $('<a>')
    .html('보이기')
    .addClass('spoiler-toggle-button')
    .click(function (event) {
      $spoilerTexts.fadeToggle();
      if ($hasSpoilingHeadings) {
        $toc.toggle();
      }
      $noticeTexts.toggle();

      if ($(this).html() == '숨기기') $(this).html('보이기');
      else $(this).html('숨기기');

      event.preventDefault();
    })
    .appendTo($noticeTexts.parent());

  $noticeTexts.toggle();
})();
// </nowiki>
