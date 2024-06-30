// <nowiki>
// @todo api.get을 호출하면 소요되는 시간 동안 문서 내용이 바뀔 수 있음.
(function (mw, $) {
  'use strict';

  /**
   * "==[[페미니즘]]=="과 같은 문자열에서 "페미니즘"을 가져오기 위한 정규식.
   * @constant
   * @type {RegExp}
   */
  var SECTION_TITLE_REGEXP = /^=+\s*\[\[([^=\]\[]+)\]\]\s*=+$/;

  /**
   * 한줄인용이 저장되는 문서 이름.
   * @constant
   * @type {string}
   */
  var DATA_TITLE = '페미위키:한줄인용';

  /**
   * 링크로 포함할 문서 이름, 예를 들어 "페미니즘은 이런 저런 것이다."라는 트윗에 페미니즘 문서로 링크를 건다면 "페미니즘"
   * @type {string}
   */
  var linkArticle;

  /**
   * @type {object}
   */
  var cache = {
    revId: null,
    wikitext: null,
    sectionId: null,
    sectionWikitext: null,
  };

  /**
   * @type {mw.Api}
   */
  var api;

  /**
   * @type {TweetbotQuickEditor}
   */
  var tweetbotQuickEditor;

  function main() {
    if (mw.config.get('wgAction') != 'view') {
      return;
    }

    mw.user.getRights().then(function (rights) {
      if (rights.indexOf('edit') < 0) {
        return;
      }

      linkArticle = mw.config.get('wgPageName').replace(/_/g, ' ');
      api = new mw.Api();

      // 메뉴에 한줄인용 버튼 추가
      $(
        mw.util.addPortletLink(
          'p-cactions',
          mw.util.getUrl(DATA_TITLE),
          '한줄인용',
          'p-tweetbot',
          '이 문서에 대한 한줄인용을 편집합니다.'
        )
      ).on('click', onClickPortletLink);
    });
  }

  /**
   * @param {Event} event
   */
  function onClickPortletLink(event) {
    event.preventDefault();
    if (!cache.revId) {
      // [[페:한줄인용]]]을 가져옵니다.
      api
        .get({
          action: 'parse',
          page: DATA_TITLE,
          prop: 'revid|wikitext',
        })
        .then(function (data) {
          storeCache({
            revId: data.parse.revid,
            wikitext: data.parse.wikitext['*'],
            sectionId: null,
            sectionWikitext: null,
          });

          findSectionIdAndOpenEditor();
        });
      return;
    }

    // 저장된 것보다 더 최신인 리비전이 있는지 확인합니다.
    api
      .get({
        action: 'parse',
        page: DATA_TITLE,
        prop: 'revid',
      })
      .then(function (data) {
        if (cache.revId == data.parse.revid && cache.sectionWikitext) {
          openEditor(cache.sectionWikitext);
          return;
        }
        api
          .get({
            action: 'parse',
            page: DATA_TITLE,
            prop: 'wikitext',
          })
          .then(function (data) {
            storeCache({
              wikitext: data.parse.wikitext['*'],
              sectionId: null,
              sectionWikitext: null,
            });

            findSectionIdAndOpenEditor();
          });
      });
  }

  /**
   *
   * @param {object} newer
   */
  function storeCache(newer) {
    var givenKeys = ['revId', 'wikitext', 'sectionId', 'sectionWikitext'];
    for (var key in newer) {
      if (givenKeys.indexOf(key) < 0) {
        console.error('invaild key ' + key + ' is used');
        return;
      }

      cache[key] = newer[key] === null ? null : newer[key];
    }
  }

  /**
   *
   */
  function findSectionIdAndOpenEditor() {
    // 현재 보고 있는 문서에 대해 이미 작성된 한줄인용이 있는지 검사합니다.
    if (findSectionId()) {
      api
        .get({
          action: 'parse',
          page: DATA_TITLE,
          section: cache.sectionId,
          prop: 'wikitext',
        })
        .then(function (data) {
          storeCache({
            sectionWikitext: data.parse.wikitext['*'],
          });

          openEditor(cache.sectionWikitext);
        });
    } else {
      OO.ui
        .confirm(
          linkArticle +
            ' 문서에 대한 한줄인용이 아직 없습니다. 추가하시겠습니까?'
        )
        .done(function (confirmed) {
          if (confirmed) {
            openEditor('== [[' + linkArticle + ']] ==\n* ');
          }
        });
    }
  }
  /**
  /* 현재 보고 있는 문서에 대해 이미 작성된 한줄인용이 있는지 검사합니다.
   */
  function findSectionId() {
    var found =
      cache.wikitext.match(
        new RegExp(
          '^=+\\s*\\[\\[' +
            linkArticle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
            '\\]\\]\\s*=+$',
          'm'
        )
      ) !== null;

    if (found) {
      var titles = cache.wikitext
        .match(new RegExp(SECTION_TITLE_REGEXP, 'gm'))
        .map(function (line) {
          return line.match(new RegExp(SECTION_TITLE_REGEXP, 'm'))[1];
        });
      // sectionId는 0이 도입부이고 제목이 있는 문단은 1부터 시작합니다.
      storeCache({
        sectionId: titles.indexOf(linkArticle) + 1,
      });
    }

    return found;
  }

  /**
   * @param text
   */
  function openEditor(text) {
    var wm = OO.ui.getWindowManager();
    var editor = getTweetbotQuickEditor();
    if (!wm.hasWindow(editor)) {
      wm.addWindows([editor]);
    }
    wm.openWindow(editor, {
      text: text,
    });
  }

  /**
   * @return {TweetbotQuickEditor}
   */
  function getTweetbotQuickEditor() {
    if (tweetbotQuickEditor === undefined) {
      tweetbotQuickEditor = new TweetbotQuickEditor();
    }
    return tweetbotQuickEditor;
  }

  /**
   * 트윗을 편집하는 편집기.
   *
   * @class TweetbotQuickEditor
   */
  function TweetbotQuickEditor(config) {
    TweetbotQuickEditor.super.call(this, config);
  }
  OO.inheritClass(TweetbotQuickEditor, OO.ui.ProcessDialog);

  TweetbotQuickEditor.static.name = 'TweetbotQuickEditor';
  TweetbotQuickEditor.static.actions = [
    {
      flags: ['primary', 'progressive', 'disabled'],
      label: '완료',
      action: 'publish',
    },
    { flags: 'safe', label: '취소' },
  ];

  TweetbotQuickEditor.prototype.initialize = function () {
    TweetbotQuickEditor.super.prototype.initialize.call(this);
    this.panel = new OO.ui.PanelLayout({
      padded: true,
      expanded: false,
    });
    this.content = new OO.ui.FieldsetLayout();

    this.editor = new OO.ui.MultilineTextInputWidget({
      autosize: true,
    });

    this.field = new OO.ui.FieldLayout(this.editor, {
      label: '아래 내용을 수정하고 완료를 누르세요.',
      align: 'top',
    });

    this.content.addItems([this.field]);
    this.panel.$element.append(this.content.$element);
    this.$body.append(this.panel.$element);

    this.editor.connect(this, {
      change: 'onInputChange',
    });
  };

  TweetbotQuickEditor.prototype.getReadyProcess = function (data) {
    return TweetbotQuickEditor.super.prototype.getReadyProcess
      .call(this, data)
      .next(function () {
        this.editor.moveCursorToEnd();
      }, this);
  };

  TweetbotQuickEditor.prototype.onInputChange = function (value) {
    this.actions.setAbilities({
      publish: value.length !== 0 && value !== cache.sectionWikitext,
    });
  };

  TweetbotQuickEditor.prototype.getBodyHeight = function () {
    return this.panel.$element.outerHeight(true);
  };

  TweetbotQuickEditor.prototype.getSetupProcess = function (data) {
    data = data || {};
    return TweetbotQuickEditor.super.prototype.getSetupProcess
      .call(this, data)
      .next(function () {
        this.editor.setValue(data.text);
      }, this);
  };

  TweetbotQuickEditor.prototype.getActionProcess = function (action) {
    var dialog = this;
    var editorText = this.editor.getValue();

    if (action != 'publish')
      return TweetbotQuickEditor.super.prototype.getActionProcess.call(
        this,
        action
      );

    return new OO.ui.Process(function () {
      api
        .get({
          action: 'parse',
          page: DATA_TITLE,
          prop: 'revid',
        })
        .then(function (data) {
          if (cache.revId == data.parse.revid) {
            if (cache.sectionId) {
              edit(cache.sectionId, editorText);
              storeCache({
                sectionWikitext: editorText,
              });
            } else {
              findAndAppend(editorText);
            }
            dialog.close({ action: action });
            return;
          }
          // wikitext를 가져왔을 때의 revId와 지금의 revId가 다르다면 충돌이 일어나지 않았는지 확인
          api
            .get({
              action: 'parse',
              page: DATA_TITLE,
              prop: 'wikitext',
            })
            .then(function (data) {
              storeCache({
                revId: data.parse.revid,
                wikitext: data.parse.wikitext['*'],
              });
              // 문단이 있는지 검사
              if (findSectionId()) {
                // 문단이 원래부터 있었거나, 없다가 생겼다면 충돌 검사 후 저장
                api
                  .get({
                    action: 'parse',
                    page: DATA_TITLE,
                    section: cache.sectionId,
                    prop: 'wikitext',
                  })
                  .then(function (data) {
                    var sectionWikitext = data.parse.wikitext['*'];
                    if (sectionWikitext == cache.sectionWikitext) {
                      // 기존 내용과 같다면 편집 충돌이 없으므로 저장
                      edit(sectionId, editorText);
                      storeCache({
                        wikitext: null,
                        sectionWikitext: editorText,
                      });
                      dialog.close({ action: action });
                      return;
                    }
                    // 충돌이므로 덮어 쓸 것인지 질문
                    // @todo diff 보이기
                    OO.ui
                      .confirm(
                        '작성하는 동안 다른 편집이 있었습니다. 무시하고 덮어 쓰시겠습니까?'
                      )
                      .done(function (confirmed) {
                        if (confirmed) {
                          edit(cache.sectionId, editorText);
                          storeCache({
                            sectionWikitext: editorText,
                          });
                          dialog.close({ action: action });
                        }
                      });
                  });
                return;
              }
              // 문단이 원래부터 없었거나, 있다가 없어졌다면 새 문단으로 추가
              api
                .get({
                  action: 'parse',
                  page: DATA_TITLE,
                  section: findSectionIdToInsert(),
                  prop: 'wikitext',
                })
                .then(function (data) {
                  edit(id, data.parse.wikitext['*'] + '\n\n' + editorText);
                  storeCache({
                    wikitext: null,
                    sectionId: cache.sectionId + 1,
                    sectionWikitext: editorText,
                  });
                  dialog.close({ action: action });
                });
            });
        });
    }, this);
  };

  function findAndAppend(wikitext) {
    var idToInsert = findSectionIdToInsert();
    api
      .get({
        action: 'parse',
        page: DATA_TITLE,
        section: idToInsert,
        prop: 'wikitext',
      })
      .then(function (data) {
        edit(idToInsert, data.parse.wikitext['*'] + '\n\n' + wikitext);
        storeCache({
          sectionId: idToInsert + 1,
          sectionWikitext: wikitext,
        });
      });
  }

  /**
   * 이 문서에 대한 한줄인용이 아직 없을 때 사전 순서 그 이전 문단 번호를 반환.
   */
  function findSectionIdToInsert() {
    var titles = cache.wikitext
      .match(new RegExp(SECTION_TITLE_REGEXP, 'gm'))
      .map(function (line) {
        return line
          .match(new RegExp(SECTION_TITLE_REGEXP, 'm'))[1]
          .replace(' ', '');
      });
    var _linkArticle = linkArticle.replace(' ', '');
    var id;
    for (id = 0; id < titles.length; id++) {
      if (titles[id].localeCompare(_linkArticle, 'ko') > 0) {
        break;
      }
    }
    return id;
  }

  /**
   *
   * @param {string} text
   */
  function edit(sectionId, text) {
    api
      .edit(DATA_TITLE, function (revision) {
        return {
          section: sectionId,
          summary: '/*' + linkArticle + '*/',
          text: text,
          tags: 'fw-tweetbot-quick-editor',
        };
      })
      .then(
        function () {
          mw.notify('저장되었습니다.');
          storeCache({
            revId: null,
            wikitext: null,
          });
        },
        function (error) {
          mw.notify(error.message);
        }
      );
  }

  main();

  // </nowiki>
})(mediaWiki, jQuery);
