// <nowiki>
(function () {
  'use strict';

  function init() {
    // 만일 개선된 필터를 사용하고 있지 않다면 아무것도 하지 않습니다.
    if (mw.user.options.get('rcenhancedfilters-disable') == 1) return;

    // 바뀐글 링크를 limit가 0인 링크로 바꿉니다.
    $('#site-navigation .changes a').attr(
      'href',
      $('#site-navigation .changes a').attr('href') + '?limit=0',
    );

    if (
      mw.config.get('wgCanonicalSpecialPageName') == 'Recentchanges' &&
      new URLSearchParams(window.location.search).get('limit') === '0'
    ) {
      // "주어진 기간 동안에 이 조건들에 맞는 바뀜이 없습니다." 메시지를 안 보여줍니다.
      var css = document.createElement('style');
      css.type = 'text/css';
      css.innerHTML =
        '.mw-rcfilters-ui-changesListWrapperWidget-results-noresult { display: none; }';
      document.body.appendChild(css);

      // 최근 바뀜 필터가 초기화된 다음
      mw.hook('structuredChangeFilters.ui.initialized').add(function () {
        var limitOption = mw.user.options.get('rclimit'),
          limitButtonIndex = 1;

        if (limitOption > 500) {
          limitButtonIndex = 5;
        } else if (limitOption > 250) {
          // limitOption = 500;
          limitButtonIndex = 4;
        } else if (limitOption > 100) {
          // limitOption = 250;
          limitButtonIndex = 3;
        } else if (limitOption > 50) {
          // limitOption = 100;
          limitButtonIndex = 2;
        } else {
          // limitOption = 50;
          limitButtonIndex = 1;
        }

        // limit를 50으로 변경하는 버튼
        var btn = $(
          '.mw-rcfilters-ui-changesLimitPopupWidget .oo-ui-buttonSelectWidget a',
        ).eq(limitButtonIndex);

        // 버튼을 누르는 동작을 흉내냅니다. 즉 limit를 50으로 다시 설정합니다.
        btn.trigger(
          jQuery.Event('mousedown', { which: OO.ui.MouseButtons.LEFT }),
        );
        btn[0].dispatchEvent(new MouseEvent('mouseup'));
      });
    }
  }

  $(init);
})();
// </nowiki>
