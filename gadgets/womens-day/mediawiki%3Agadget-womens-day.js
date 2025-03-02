// <nowiki>
/**
 * [[틀:스포일러]] 를 보조합니다
 */
'use strict';
(() => {
  const today = new Date();

  // 3월 1일부터 8일까지 표시
  if (today.getMonth() != 2 || today.getDate() > 8) {
    return;
  }

  document.body.classList.add('womens-day');

  // 사파리는 아직 scrollend가 없음
  const hasScrollEnd = 'onscrollend' in window;
  let setTimeoutHandle = -1;

  const element = document.createElement('div');
  element.classList.add('womens-day-touch-scroll');
  element.hidden = true;
  document.body.append(element);

  window.addEventListener('pointercancel', (ev) => {
    if (ev.pointerType !== 'touch') {
      return;
    }
    element.style.left = `${ev.x}px`;
    element.style.top = `${ev.y}px`;
    element.hidden = false;
    if (!hasScrollEnd) {
      clearTimeout(setTimeoutHandle);
      setTimeoutHandle = setTimeout(() => {
        element.hidden = true;
      }, 3000);
    }
  });

  window.addEventListener('scrollend', (ev) => {
    element.hidden = true;
  });
})();
// </nowiki>
