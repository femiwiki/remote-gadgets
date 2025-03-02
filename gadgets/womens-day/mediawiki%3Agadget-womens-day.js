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
})();
// </nowiki>
