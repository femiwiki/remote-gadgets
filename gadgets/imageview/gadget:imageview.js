// <nowiki>
(function () {
  'use strict';

  $('#content a.image').click(function (event) {
    event.preventDefault();

    var overlay = $('<div id="Imageview-overlay"></div>')
      .click(function () {
        $(this).remove();
        overlay = undefined;
        $('body').css('overflow', 'auto');
      })
      .appendTo('body');

    overlay.append(
      $('<img></img>')
        .attr(
          'src',
          'https://upload.wikimedia.org/wikipedia/commons/d/de/Ajax-loader.gif'
        )
        .addClass('loading-spinner')
    );

    $('body').css('overflow', 'hidden');
    new mw.Api()
      .get({
        action: 'query',
        titles: decodeURI(
          $(this)
            .attr('href')
            .match(/\/([^/]+)$/)[1]
        ),
        prop: 'imageinfo',
        iiprop: 'url',
      })
      .then(function (data) {
        if (overlay === undefined) return;
        var imageSource;
        Object.keys(data.query.pages).forEach(function (page) {
          imageSource = data.query.pages[page].imageinfo[0].url;
        });

        overlay.append(
          $('<img></img>').attr('src', imageSource).addClass('image')
        );
      });
  });
})();
// </nowiki>
