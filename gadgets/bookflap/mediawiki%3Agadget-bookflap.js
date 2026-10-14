/**
 * [[틀:책날개]]를 보조합니다.
 */
// <nowiki>
(function () {
  var $raws = $('.book-flap-raw');
  if (
    mw.config.get('skin') != 'femiwiki' ||
    $raws.length === 0 ||
    mw.config.get('wgPageContentModel') == 'flow-board'
  )
    return;

  // FemiwikiSkin 6 draws the ToC outside the content and leaves a right column
  // (FemiwikiSkin#348), so 책날개 goes there instead of buttons in the content.
  if (!document.getElementById('fw-page-aside')) return;
  outsideContent();

  function makeCollapsible($root) {
    var $li = $root.find('.book-flap-body > ul > li');
    $li.each(function () {
      var $hidable = $(this).children('ul');
      if ($hidable.length === 0) return;

      $('<div>')
        .addClass('bookflap-collapse-button')
        .html('▼')
        .prependTo($(this))
        .click(function () {
          $hidable.toggle();
        });

      if ($(this).find('.mw-selflink').length === 0) $hidable.hide();
    });
  }

  /**
   * Wide screens show 책날개 in the right column. Where that column is too
   * narrow, it is a "둘러보기" tab next to the ToC, in the column or the drawer.
   */
  function outsideContent() {
    var $body = $('body').addClass('book-flap-outside');
    var $aside = $('<div></div>')
      .addClass('book-flap-aside skin-fw-unprintable')
      .appendTo($('#fw-page-aside'));
    var $pane = $('<div></div>').addClass('book-flap-pane');

    $raws.each(function () {
      var $raw = $(this);
      $.each([$aside, $pane], function (_, $target) {
        var $flap = $('<div></div>')
          .addClass('book-flap-side')
          .append(
            $('<div></div>')
              .addClass('book-flap-title')
              .append(
                $raw
                  .find('.book-flap-title a, .book-flap-title .mw-selflink')
                  .clone()
              ),
            $raw.find('.book-flap-body').clone().addClass('mw-parser-output')
          )
          .appendTo($target);
        if ($raw.hasClass('book-flap-collapsible')) makeCollapsible($flap);
      });
    });

    var $toc = $('#fw-toc');
    var $toggle = $('#fw-toc-toggle');
    if ($toc.length === 0) {
      // Pages without a ToC get the skin's drawer for 책날개 alone.
      $toc = $('<nav></nav>')
        .attr({ id: 'fw-toc', 'aria-labelledby': 'fw-toc-heading' })
        .addClass('fw-toc book-flap-only')
        .append(
          $('<label></label>')
            .addClass('fw-toc-backdrop')
            .attr({ for: 'fw-toc-checkbox', 'aria-hidden': 'true' }),
          $('<div></div>')
            .addClass('fw-toc-panel')
            .append(
              $('<div></div>')
                .addClass('fw-toc-header')
                .append(
                  $('<h2></h2>')
                    .attr('id', 'fw-toc-heading')
                    .addClass('fw-toc-heading')
                    .text('둘러보기'),
                  $('<label></label>')
                    .addClass('fw-toc-close fw-button')
                    .attr({ for: 'fw-toc-checkbox', title: '닫기' })
                )
            )
        )
        .appendTo($('.fw-page').addClass('fw-page-has-toc'));
      $toggle = $('<label></label>')
        .attr({
          id: 'fw-toc-toggle',
          for: 'fw-toc-checkbox',
          'aria-controls': 'fw-toc',
          tabindex: '0',
        })
        .addClass('mw-checkbox-hack-button fw-button')
        .text('둘러보기')
        .prependTo($('#p-title-buttons .right-buttons'));
    } else {
      var $tabs = $('<div></div>')
        .addClass('book-flap-tabs')
        .attr('role', 'tablist');
      var select = function (name) {
        $toc.toggleClass('book-flap-tab-flap', name === 'flap');
        $tabs.children().each(function () {
          var selected = $(this).attr('data-tab') === name;
          $(this)
            .toggleClass('book-flap-tab-selected', selected)
            .attr('aria-selected', String(selected));
        });
      };
      $.each(
        [
          ['toc', '목차'],
          ['flap', '둘러보기'],
        ],
        function (_, tab) {
          $('<button></button>')
            .attr({ type: 'button', role: 'tab', 'data-tab': tab[0] })
            .addClass('book-flap-tab')
            .text(tab[1])
            .on('click', function () {
              select(tab[0]);
            })
            .appendTo($tabs);
        }
      );
      $toc.addClass('book-flap-has-tabs').find('.fw-toc-header').prepend($tabs);
      select('toc');
      $toggle.text('목차·둘러보기');
    }
    $toc.find('.fw-toc-panel').append($pane);

    // The right column takes 책날개 once it is wide enough for it.
    var page = document.querySelector('.fw-page');
    var scheduled = false;
    function layout() {
      scheduled = false;
      var style = page && window.getComputedStyle(page);
      var width =
        style && style.display === 'grid'
          ? parseFloat(style.gridTemplateColumns.split(' ')[2]) || 0
          : 0;
      var rem = parseFloat(
        window.getComputedStyle(document.documentElement).fontSize
      );
      $body.toggleClass('book-flap-aside-mode', width >= 14 * rem);
    }
    $(window).on('resize', function () {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(layout);
      }
    });
    layout();
  }
})();
// </nowiki>
