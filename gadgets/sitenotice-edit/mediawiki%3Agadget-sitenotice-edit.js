// <nowiki>
(function () {
  var mustache =
    '\
<div class="sitenotice-edit--buttons">\
  {{#buttons}}\
  <a class="sitenotice-edit--button sitenotice-edit--{{id}}-button"\
    href="/index.php?title=MediaWiki:Sitenotice&{{query}}"\
    title="{{desc}}"\
  ></a>\
  {{/buttons}}\
</div>\
';
  var template = mw.template.compile(mustache, 'mustache');
  var data = {
    buttons: [
      {
        id: 'history',
        query: 'diff=next',
        desc: '마지막 공지사항과 차이 보기',
      },
      {
        id: 'edit',
        query: 'veaction=edit',
        desc: '공지사항 편집하기',
      },
    ],
  };
  var dom = template.render(data)[0];

  var sitenotice = document.querySelector('#localNotice, #centralNotice');
  var header = document.querySelector('.fw-header');
  var close = document.querySelector('.mw-dismissable-notice-close');
  if (close) {
    close.parentElement.insertBefore(dom, close.nextSibling);
  } else if (sitenotice) {
    sitenotice.append(dom);
  } else {
    document.body.insertBefore(dom, header);
  }
})();
