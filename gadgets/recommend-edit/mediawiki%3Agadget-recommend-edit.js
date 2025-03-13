// <nowiki>
'use strict';
(() => {
  // 편집 불가한 경우에만 표시
  if (document.body.classList.contains('mw-editable')) {
    return;
  }

  const element = document.createElement('div');
  element.classList.add('fw-edit');
  element.innerHtml = mw.msg('skin-view-edit');
  element.title = mw.msg('tooltip-ca-edit');
  element.addEventListener('click', (e) => {
    OO.ui
      .confirm('가입하면 내용을 직접 고칠 수 있습니다.', {
        actions: [
          {
            action: 'accept',
            label: OO.ui.deferMsg('userlogin-joinproject'),
            flags: 'primary',
          },
          {
            action: 'reject',
            label: OO.ui.deferMsg('ooui-dialog-message-reject'),
            flags: 'safe',
          },
        ],
      })
      .done((confirmed) => {
        if (confirmed) {
          window.location.href = new mw.Title('Special:CreateAccount').getUrl({
            returnto: mw.config.get('wgPageName'),
          });
        }
      });
  });

  const content = document.querySelector('#content');
  content.append(element);
})();
// </nowiki>
