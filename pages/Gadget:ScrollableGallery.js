//<nowiki>
(function() {
  $(".mw-gallery-traditional").each(function() {
    if ($(this).get(0).scrollWidth > $(this).innerWidth())
      $(this).addClass("scroll-right");

    var maxScrollLeft = $(this).get(0).scrollWidth - $(this).innerWidth();
    $(this).scroll(function() {
      if ($(this).scrollLeft() < maxScrollLeft)
        $(this).addClass("scroll-right");
      else $(this).removeClass("scroll-right");
    });
  });
})();
//</nowiki>
