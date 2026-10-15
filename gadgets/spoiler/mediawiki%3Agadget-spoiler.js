// <nowiki>
/**
 * [[틀:스포일러]] 를 보조합니다
 */
(function () {
  'use strict';

  function init($content) {
    var $noticeTexts = $content.find('.spoiler-notice-text');
    var $spoilerTexts = $content.find('.spoiler-text');
    var hasSpoilingHeadings = !!$spoilerTexts.has('h1,h2,h3,h4,h5,h6').length;

    if ($noticeTexts.length === 0 || $spoilerTexts.length === 0) return;

    var noticeBody = $noticeTexts[0].parentElement;
    if (noticeBody.querySelector('.spoiler-toggle-button')) return;

    var $toc = $('#toc, .toc');
    if (hasSpoilingHeadings) {
      $toc.hide();
    }
    $content.find('.spoiler-js').show();

    var anchor = document.createElement('a');
    anchor.textContent = '보이기';
    anchor.classList.add('spoiler-toggle-button');
    anchor.addEventListener('click', function (event) {
      $spoilerTexts.fadeToggle();
      if (hasSpoilingHeadings) {
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
    noticeBody.append(anchor);

    $noticeTexts.toggle();
  }

  mw.hook('wikipage.content').add(init);
})();
// </nowiki>
