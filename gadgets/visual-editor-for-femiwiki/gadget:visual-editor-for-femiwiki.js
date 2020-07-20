//<nowiki>
(function (mw, $) {
  'use strict';

  /**
   * =r을 입력하면 출처 문단이 만들어지게 합니다.
   */
  mw.libs.ve.addPlugin(function () {
    /**
     * @class AddReferencesListCommand
     */
    var AddReferencesListCommand = function () {
      AddReferencesListCommand.parent.call(
        this,
        'addReferencesList' // Command name
      );
    };
    OO.inheritClass(AddReferencesListCommand, ve.ui.Command);

    AddReferencesListCommand.prototype.execute = function (surface) {
      // surface.execute.apply(
      //   surface,
      //   ["format", "convert"].concat(["heading", { level: 2 }])
      // );
      surface
        .getModel()
        .getFragment()
        .insertContent(
          [
            {
              type: 'heading',
              attributes: {
                level: 2,
              },
            },
          ]
            .concat('출처'.split(''))
            .concat({
              type: '/heading',
            })
            .concat({
              type: 'mwReferencesList',
              attributes: {
                listGroup: 'mwReference/',
                refGroup: '',
                isResponsive: mw.config.get('wgCiteResponsiveReferences'),
              },
            })
            .concat({ type: '/mwReferencesList' })
        )
        .collapseToEnd()
        .select();

      return true;
    };
    // class ends

    ve.ui.commandRegistry.register(new AddReferencesListCommand());
    ve.ui.sequenceRegistry.register(
      new ve.ui.Sequence(
        'addReferencesList', // Sequence name
        'addReferencesList', // Command name
        '=r',
        2
      )
    );

    ve.ui.commandHelpRegistry.register('insert', 'addReferencesList', {
      sequences: ['addReferencesList'],
      label: '출처 문단 넣기',
    });

    // 문서 옵션의 분류 버튼 클릭시 addCategories 커맨드를 실행하게 합니다
    ve.ui.toolFactory.registry.referencesList.static.commandName =
      'addReferencesList';
  });

  /**
   * =n을 입력하면 부연 설명 문단이 만들어지게 합니다.
   */
  mw.libs.ve.addPlugin(function () {
    /**
     * @class AddNotesSectionCommand
     */
    var AddNotesSectionCommand = function () {
      // Parent constructor
      AddNotesSectionCommand.parent.call(
        this,
        'addNotesSection' // Command name
      );
    };
    OO.inheritClass(AddNotesSectionCommand, ve.ui.Command);

    AddNotesSectionCommand.prototype.execute = function (surface) {
      // surface.execute.apply(
      //   surface,
      //   ["format", "convert"].concat(["heading", { level: 2 }])
      // );
      surface
        .getModel()
        .getFragment()
        .insertContent(
          [
            {
              type: 'heading',
              attributes: {
                level: 2,
              },
            },
          ]
            .concat('부연 설명'.split(''))
            .concat({
              type: '/heading',
            })
            .concat({
              type: 'mwTransclusionBlock',
              attributes: {
                mw: {
                  parts: [
                    {
                      template: {
                        target: {
                          href: '틀:부연 설명',
                          wt: '부연 설명',
                        },
                        params: {},
                      },
                    },
                  ],
                },
              },
            })
            .concat({ type: '/mwTransclusionBlock' })
        )
        .collapseToEnd()
        .select();

      return true;
    };
    // class ends

    ve.ui.commandRegistry.register(new AddNotesSectionCommand());
    ve.ui.sequenceRegistry.register(
      new ve.ui.Sequence(
        'addNotesSection', // Sequence name
        'addNotesSection', // Command name
        '=n',
        2
      )
    );

    ve.ui.commandHelpRegistry.register('insert', 'addNotesSection', {
      sequences: ['addNotesSection'],
      label: '부연 설명 문단 넣기',
    });

    /**
     * MediaWiki UserInterface references list tool.
     *
     * @class
     * @extends ve.ui.FragmentWindowTool
     * @constructor
     * @param {OO.ui.ToolGroup} toolGroup
     * @param {Object} [config] Configuration options
     */
    var NotesSectionTool = function VeUiMWReferencesListDialogTool() {
      NotesSectionTool.super.apply(this, arguments);
    };
    OO.inheritClass(NotesSectionTool, ve.ui.FragmentWindowTool);
    NotesSectionTool.static.name = 'notesSection';
    NotesSectionTool.static.group = 'object';
    NotesSectionTool.static.icon = 'speechBubbles';
    NotesSectionTool.static.title = '부연 설명 목록';
    NotesSectionTool.static.modelClasses = [ve.dm.MWReferencesListNode];
    NotesSectionTool.static.commandName = 'addNotesSection';
    ve.ui.toolFactory.register(NotesSectionTool);
  });

  /**
   * 분류 틀 관련 플러그인.
   * - 문서 옵션에서 분류를 클릭하면 분류 틀이 입력되도록 합니다.
   * - Ctrl+Shift+A 입력시 분류 틀이 입력되도록 합니다.
   */
  mw.libs.ve.addPlugin(function () {
    /**
     * @Class AddCategoriesCommand
     */
    var AddCategoriesCommand = function () {
      AddCategoriesCommand.parent.call(
        this,
        'addCategories' // Command name
      );
    };
    OO.inheritClass(AddCategoriesCommand, ve.ui.Command);

    AddCategoriesCommand.prototype.execute = function (surface) {
      surface.getModel().selectLastContentOffset();
      surface
        .getModel()
        .getFragment()
        .insertContent([
          {
            type: 'mwTransclusionBlock',
            attributes: {
              mw: {
                parts: [
                  {
                    template: {
                      target: {
                        href: '틀:분류',
                        wt: '분류',
                      },
                      params: {},
                    },
                  },
                ],
              },
            },
          },
          { type: '/mwTransclusionBlock' },
        ])
        .collapseToEnd()
        .select();
    };
    // class ends

    ve.ui.commandRegistry.register(new AddCategoriesCommand());
    ve.ui.triggerRegistry.register('addCategories', {
      pc: new ve.ui.Trigger('alt+shift+a'),
    });

    // 문서 옵션의 분류 버튼 클릭시 addCategories 커맨드를 실행하게 합니다
    ve.ui.toolFactory.registry.categories.static.commandName = 'addCategories';

    ve.ui.commandHelpRegistry.register('insert', 'addCategories', {
      trigger: 'addCategories',
      label: '분류 넣기',
    });
  });

  /**
   * 기존에 '* '를 입력한 경우에 덧붙여 - '을 입력한 경우에도 점 목록으로 인식합니다.
   */
  function addDashSequence() {
    ve.ui.sequenceRegistry.register(
      new ve.ui.Sequence(
        'dash',
        'bulletWrapOnce',
        [{ type: 'paragraph' }, '-', ' '],
        2
      )
    );

    ve.ui.commandHelpRegistry.register('formatting', 'listBullet', {
      sequences: ['dash'],
    });
  }
  mw.libs.ve.addPlugin(addDashSequence); // for VisualEditor
  mw.loader.using(['ext.visualEditor.core']).done(function () {
    addDashSequence(); // for Stuructured Discussion
  });

  /**
   * 아이폰과 안드로이드에서 [[미디어위키:Visualeditor-browserwarning]] 경고가
   * 뜨지 않게 합니다.
   * https://github.com/femiwiki/mediawiki/issues/262
   */
  mw.libs.ve.addPlugin(function () {
    ve.init.mw.DesktopArticleTarget.static.compatibility.whitelist[
      'iphone'
    ] = null;
    ve.init.mw.DesktopArticleTarget.static.compatibility.whitelist[
      'android'
    ] = null;
  });
})(mediaWiki, jQuery);
// </nowiki>
