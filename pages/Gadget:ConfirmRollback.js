$("span.mw-rollback-link")
  .find("a")
  .on("click", function(e) {
    e.preventDefault();
    if (confirm("마지막 사용자가 한 모든 편집을 한번에 되돌리시겠습니까?")) {
      window.location.href = $(this).attr("href");
    }
  });
