// <nowiki>
(function () {
  'use strict';

  if (mw.config.get('wgCanonicalSpecialPageName') != 'Recentchanges') {
    return;
  }
  var substitute = '<del>(가려짐)</del>';
  var substitute2 = '<i>(이름이 변경됨)</i>';

  mw.hook('wikipage.content').add(function () {
    // ~님에 대한 부적절한 사용자명 변경 건의
    $('.mw-changeslist a').each(function () {
      var isLinkToSanction = $(this)
        .html()
        .match(/님에 대한 부적절한 사용자명 변경 건의/);

      if (isLinkToSanction) {
        $(this).html(
          '사용자:' + substitute + ' 님에 대한 부적절한 사용자명 변경 건의'
        );
      }
    });

    // 사용자 문서와 사용자 이름 바꾸기 기록
    $('.mw-changeslist .mw-redirect').each(function () {
      if ($(this).attr('title').startsWith('사용자:')) {
        if ($(this).html().startsWith('사용자:')) {
          $(this).html('사용자:' + substitute2);
        } else {
          $(this).html(substitute2);
        }
      }
    });
  });
})();
// </nowiki>
