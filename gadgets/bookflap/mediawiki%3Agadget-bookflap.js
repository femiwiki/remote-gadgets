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

  var $overlay = $('<div></div>')
    .addClass('book-flap-overlay')
    .appendTo($('body'));
  var $leftside = $('<div></div>')
    .attr('id', 'book-flap-leftside')
    .attr('class', 'skin-fw-unprintable')
    .insertBefore($('#p-header'));
  var $rightside = $('<div></div>')
    .attr('id', 'book-flap-rightside')
    .attr('class', 'skin-fw-unprintable')
    .insertBefore($('#p-header'));
  var $closeButton = $('<div></div>')
    .attr('id', 'book-flap-close-button')
    .mousedown(function () {
      $overlay.hide();
      $('body').css('overflow', 'auto');
    })
    .appendTo($overlay);

  $raws.each(function () {
    var $title = $(this).find(
      '.book-flap-title a, .book-flap-title .mw-selflink',
    );
    var $slideBookFlap = $('<div></div>')
      .addClass('book-flap-slide')
      .html($(this).find('book-flap-raw book-flap-title'))
      .append(
        $(this).find('.book-flap-body').clone().addClass('mw-parser-output'),
      )
      .appendTo($overlay);

    var $openButton = $(this).find('.book-flap-button');
    var $slideTitle = $('<div></div>')
      .addClass('book-flap-title')
      .append($title.clone())
      .prependTo($slideBookFlap);

    var selflinkOffset =
      $slideBookFlap.find('.mw-selflink').length !== 0 ? null : undefined;

    $openButton
      .click(function () {
        $overlay.show();
        $slideBookFlap.siblings().hide();
        $slideBookFlap.show();
        $closeButton.show();

        /*if ( selflinkOffset === null )
					selflinkOffset = slideBookFlap.find( '.mw-selflink' ).offset().top - 100;
				slideBookFlap.scrollTop( selflinkOffset );*/
        $('body').css('overflow', 'hidden');

        var $tooltip = $('.book-flap-tooltip');
        if ($tooltip.length !== 0) {
          $.cookie('femiwiki-bookflap-used', 1, { expires: 30 });
          $tooltip.hide();
        }
      })
      .insertAfter($(this))
      .removeClass('disabled')
      .find('.image')
      .each(function () {
        $(this).after($(this).find('img')).remove();
      });

    $slideTitle
      .css('background-color', $openButton.css('background-color'))
      .children()
      .css('color', $openButton.css('color'));

    var $sideBookFlap = $('<div></div>')
      .addClass('book-flap-side')
      .html($(this).find('book-flap-raw book-flap-title'))
      .append(
        $(this).find('.book-flap-body').clone().addClass('mw-parser-output'),
      )
      .appendTo($(this).hasClass('book-flap-left') ? $leftside : $rightside)
      .hide()
      .fadeIn();

    var $sideTitle = $('<div></div>')
      .addClass('book-flap-title')
      .append($title.clone())
      .prependTo($sideBookFlap);

    var isCollapsible = $(this).hasClass('book-flap-collapsible');

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

    if (isCollapsible) {
      makeCollapsible($slideBookFlap);
      makeCollapsible($sideBookFlap);
    }
  });

  if ($raws.length !== 0) {
    var used = $.cookie('femiwiki-bookflap-used');
    if (used === null) {
      $('<div>터치!</div>')
        .addClass('book-flap-tooltip')
        .appendTo($('.book-flap-button:first'));
    }
  }
})();
// </nowiki>
