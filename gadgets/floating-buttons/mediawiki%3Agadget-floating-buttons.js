// <nowiki>
'use strict';
// Floating buttons show once the end of the content is on screen. A gadget
// that adds one sets .fw-floating-buttons on <html> to reserve room for it.
(() => {
  const root = document.documentElement;

  let atEnd = mw.config.get('wgIsMainPage');
  let searching = false;
  let shown;
  const update = () => {
    const visible = atEnd && !searching;
    if (visible === shown) {
      return;
    }
    shown = visible;
    root.classList.toggle('fw-floating-buttons-visible', visible);
    mw.hook('fw.floatingButtons').fire(visible);
  };

  const end =
    document.querySelector('#catlinks:not(.catlinks-allhidden)') ||
    document.querySelector('#content-end-bar') ||
    document.querySelector('#footer');
  if (!end || !('IntersectionObserver' in window)) {
    atEnd = true;
  } else if (!atEnd) {
    // Also when the end is above the screen, as at the very bottom of a page
    new IntersectionObserver(([entry]) => {
      atEnd = entry.isIntersecting || entry.boundingClientRect.top < 0;
      update();
    }).observe(end);
  }

  // The full-screen search on phones (FemiwikiSkin#1104)
  const search = document.querySelector('#p-search');
  const phone = window.matchMedia('(max-width: 639px)');
  if (search) {
    const checkSearch = () => {
      searching =
        phone.matches && !!search.querySelector('.fw-typeahead-search--active');
      update();
    };
    new MutationObserver(checkSearch).observe(search, {
      subtree: true,
      attributeFilter: ['class'],
    });
    phone.addEventListener('change', checkSearch);
  }

  update();
})();
// </nowiki>
