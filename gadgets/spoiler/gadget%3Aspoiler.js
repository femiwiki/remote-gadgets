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

  var anchor = document.createElement("a");
  anchor.textContent = '보이기';
  anchor.classList.add('spoiler-toggle-button');
  anchor.addEventListener("click", function (event) {
    $spoilerTexts.fadeToggle();
    if ($hasSpoilingHeadings) {
      $toc.toggle();
    }
    $noticeTexts.toggle();

    if (this.textContent === '숨기기') {
      this.textContent = '보이기';
    } else {
      this.textContent = '숨기기';
    }

    event.preventDefault();
  });
  $noticeTexts[0].parentElement.append(anchor);

  mw.hook('ve.deactivationComplete').add(function () {
    $noticeTexts = $('.spoiler-notice-text');
    $spoilerTexts = $('.spoiler-text');
    $noticeTexts[0].parentElement.append(anchor);
  });

  $noticeTexts.toggle();
})();
// </nowiki>
