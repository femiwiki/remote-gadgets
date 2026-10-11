// <nowiki>
'use strict';
(() => {
  const root = document.documentElement;
  root.classList.add('fw-floating-buttons', 'fw-discord-widget');

  // An exact version with its hash, since mw.loader.getScript cannot check
  // one. jsDelivr's minified copies are generated, so the file is named.
  const script = document.createElement('script');
  script.src =
    'https://cdn.jsdelivr.net/npm/@widgetbot/crate@3.9.1/umd/crate.js';
  script.integrity =
    'sha384-/V74pmmoTr61OTxwVCpoI5cIaf4wzO9ZCyQ82JeTghgR6u2n2DCiY3czxsUP5Svp';
  script.crossOrigin = 'anonymous';
  script.addEventListener('load', () => {
    const style = getComputedStyle(root);
    const px = (name) => {
      const probe = document.createElement('div');
      probe.style.width = style.getPropertyValue(name);
      document.body.append(probe);
      const width = probe.getBoundingClientRect().width;
      probe.remove();
      return width;
    };
    const size = px('--fw-floating-button-size');
    const inset = px('--fw-floating-button-inset');

    const crate = new Crate({
      server: '314953743185477644',

      // 공개잡담방
      channel: '314953743185477644',

      // Do not load Discord until user clicks the widget
      defer: true,

      // 보라 4, for the white icon
      color: '#736ac9',

      location: [-inset, -inset],

      // A floating button of the 2026 design guide
      css: `
        .button, .icons { width: ${size}px; height: ${size}px; }
        .button { border-radius: 50%; }
        .open { padding: ${size / 4}px; }
        .close { padding: ${size / 3}px; }
        @media (prefers-reduced-motion: reduce) {
          .root, .button, .icons > * { animation: none; transition: none; }
        }
      `,
    });

    // The open chat keeps its button, which closes it
    let visible = false;
    let open = false;
    const apply = () => {
      if (visible || open) {
        crate.show();
      } else {
        crate.hide();
      }
    };
    crate.store.subscribe(() => {
      if (crate.store.getState().open !== open) {
        open = !open;
        apply();
      }
    });
    mw.hook('fw.floatingButtons').add((shown) => {
      visible = shown;
      apply();
    });
  });
  document.head.appendChild(script);
})();
// </nowiki>
