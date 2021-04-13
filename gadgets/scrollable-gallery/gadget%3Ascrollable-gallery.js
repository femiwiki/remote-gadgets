//<nowiki>
(function () {
  'use strict';
  document.querySelectorAll('.mw-gallery-traditional').forEach(function (ele) {
    var maxScrollLeft = ele.scrollWidth - ele.clientWidth;

    function drawShadow() {
      if (ele.scrollLeft < maxScrollLeft) {
        ele.classList.add('scroll-right');
      } else {
        ele.classList.remove('scroll-right');
      }

      if (ele.scrollLeft > 0) {
        ele.classList.add('scroll-left');
      } else {
        ele.classList.remove('scroll-left');
      }
    }

    drawShadow();
    ele.addEventListener('scroll', drawShadow);
  });
})();
//</nowiki>
