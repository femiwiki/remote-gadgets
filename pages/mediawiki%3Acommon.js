/* 이 자바스크립트 설정은 모든 문서, 모든 사용자에게 적용됩니다. */

// PageViewInfoGA 비활성화로 인해 gtag를 common.js에서 대신 호출
const gtagScript = document.createElement('script');
gtagScript.setAttribute(
  'src',
  'https://www.googletagmanager.com/gtag/js?id=UA-82072330-1'
);
gtagScript.addEventListener('load', function () {
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', 'UA-82072330-1');
});
document.getElementsByTagName('head')[0].appendChild(gtagScript);
