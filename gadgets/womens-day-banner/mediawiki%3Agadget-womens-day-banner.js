// <nowiki>
'use strict';
const DTIME = 1741341600;
let timer;

function loadFont() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Gugi&display=swap';
  document.head.appendChild(link);
}

function updateTime(banner) {
  const now = Math.floor(Date.now() / 1000);
  const diffSec = DTIME - now;
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  let text;
  if (diffSec <= 0 && diffSec > -60 * 60 * 3) {
    text = '진행 중';
  } else if (diffSec < -60 * 60 * 3) {
    text = '종료';
    clearInterval(timer); // 시간이 지나면 새로고침 중단
  } else if (diffHour > 0) {
    text = `${diffHour}시간 후 시작`;
  } else if (diffMin > 0) {
    text = `${diffMin}분 후 시작`;
  } else {
    text = '잠시 후 시작';
  }

  banner.innerHTML = text;
}

function updateCountdown() {
  updateTime();

  // 1시간 이내일 때 1초마다 갱신
  if (DTIME - Math.floor(Date.now() / 1000) < 3600 && diffSec > -60 * 60 * 3) {
    timer = setInterval(updateTime, 1000);
  }
}

(() => {
  loadFont();
  const banner = document.querySelector('#localNotice figcaption');
  updateTime(banner);
})();
// </nowiki>
