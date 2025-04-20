// <nowiki>
'use strict';
(async () => {
  await mw.loader.getScript('https://cdn.jsdelivr.net/npm/@widgetbot/crate@3');

  const rem = parseFloat(getComputedStyle(document.documentElement,null).fontSize)

  new Crate({
    server: '314953743185477644',

    // 공개잡담방
    channel: '314953743185477644',

    // Do not load Discord until user clicks the widget
    defer: true,

    // femiwiki color
    color: "#aca6e4",

    location: [-rem * 6, -rem * 1]
  });
})();
// </nowiki>
