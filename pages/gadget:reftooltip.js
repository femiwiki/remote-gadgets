/* <ref> 태그를 통한 주석에 마우스를 올려다 놓았을 때 내용을 툴팁으로 뜨게 합니다. */

function jq(myid) {
  return "#" + myid.replace(/(:|\.|\[|\]|,|=|@)/g, "\\$1");
}

$(document).ready(function() {
  $(".reference").each(function() {
    var anchor = $(this).children("a");
    if (anchor.length === 0 || anchor.attr("href") === undefined) return;
    var referenceId = anchor.attr("href").match(/#([^#]+)$/)[1],
      referenceText = $(jq(referenceId) + " .reference-text").text();

    $(this).attr("title", referenceText);
  });
});
