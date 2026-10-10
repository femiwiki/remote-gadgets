// <nowiki>
'use strict';
(() => {
  // An exact version with its hash, since mw.loader.getScript cannot check
  // one. jsDelivr's minified copies are generated, so the file is named.
  const script = document.createElement('script');
  script.src =
    'https://cdn.jsdelivr.net/npm/@widgetbot/crate@3.9.1/umd/crate.js';
  script.integrity =
    'sha384-/V74pmmoTr61OTxwVCpoI5cIaf4wzO9ZCyQ82JeTghgR6u2n2DCiY3czxsUP5Svp';
  script.crossOrigin = 'anonymous';
  script.addEventListener('load', () => {
    const rem = parseFloat(
      getComputedStyle(document.documentElement, null).fontSize
    );

    new Crate({
      server: '314953743185477644',

      // 공개잡담방
      channel: '314953743185477644',

      // Do not load Discord until user clicks the widget
      defer: true,

      // femiwiki color
      color: '#aca6e4',

      location: [-rem * 6, -rem * 1],
    });
  });
  document.head.appendChild(script);
})();
// </nowiki>
