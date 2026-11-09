// <nowiki>
/**
 * [[틀:스포일러]] 를 보조합니다
 */
(() => {
	"use strict";

	function init($content) {
		var content = $content[0];
		var noticeText = content.querySelector(".spoiler-notice-text");
		if (!noticeText || !content.querySelector(".spoiler-text")) return;

		var noticeBody = noticeText.parentElement;
		if (noticeBody.querySelector(".spoiler-toggle-button")) return;

		// The rest is done by spoiler-styles
		content.querySelectorAll(".spoiler-js, .spoiler-hide").forEach((el) => {
			el.style.display = "";
		});
		document.body.classList.add("spoiler-ready");
		if (content.querySelector(".spoiler-text :is(h1,h2,h3,h4,h5,h6)")) {
			document.body.classList.add("spoiler-has-headings");
		}

		// A real button, so Tab reaches it and Enter or Space presses it.
		var button = document.createElement("button");
		button.type = "button";
		button.textContent = "보이기";
		button.className = "spoiler-toggle-button";
		button.setAttribute("aria-expanded", "false");
		button.addEventListener("click", () => {
			var shown = document.body.classList.toggle("spoiler-shown");
			button.textContent = shown ? "숨기기" : "보이기";
			button.setAttribute("aria-expanded", String(shown));
		});
		noticeBody.append(button);
	}

	mw.hook("wikipage.content").add(init);
})();
// </nowiki>
