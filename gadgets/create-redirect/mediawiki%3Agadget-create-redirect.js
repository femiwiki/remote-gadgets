// <nowiki>
(function () {
  'use strict';

  var target;

  function main() {
    $(
      mw.util.addPortletLink(
        'p-cactions',
        '#',
        '여기로 넘겨주기',
        'p-createRedirect',
        '이 문서로 오는 넘겨주기 문서를 만듭니다.',
      ),
    ).on('click', function (e) {
      e.preventDefault();
      target = mw.config.get('wgPageName').replace(/_/g, ' ');
      mw.loader.using(['oojs-ui-core']).done(function () {
        prompt();
      });
    });
  }

  function prompt(text) {
    OO.ui
      .prompt('"' + target + '" 문서로 넘겨주기 할 문서 이름을 입력하세요.', {
        textInput: {
          placeholder: '새 문서 이름',
          value: text,
        },
      })
      .done(handleInput);
  }

  function handleInput(title) {
    if (title === null) {
      return;
    }

    new mw.Api()
      .get({
        action: 'query',
        titles: title,
      })
      .done(function (data) {
        afterExistanceQuery(data, title);
      });
  }

  function afterExistanceQuery(data, title) {
    if (Object.keys(data.query.pages).indexOf('-1') == -1) {
      OO.ui.alert('"' + title + '" 문서는 이미 존재합니다.').done(function () {
        prompt(title);
      });
      return;
    }

    OO.ui
      .confirm(
        '"' +
          title +
          '" 문서에서 "' +
          target +
          '" 문서로 넘겨주기를 만드시겠습니까?',
      )
      .done(function (confirmed) {
        if (confirmed) {
          new mw.Api()
            .create(title, {}, '#넘겨주기 [[' + target + ']]')
            .then(function () {
              mw.notify(
                '"' +
                  title +
                  '" 문서에서 ' +
                  '"' +
                  target +
                  '" 문서로 넘겨주기 문서가 생성되었습니다.',
              );
            })
            .fail(function (e) {
              mw.notify('문서 생성에 실패하였습니다');
              console.error(e);
            });
        } else {
          prompt(title);
        }
      });
  }

  main();
})();
// </nowiki>
