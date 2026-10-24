// <nowiki>
/**
 * [[틀:스포일러]] 를 보조합니다
 */
(() => {
	"use strict";

	function init($content) {
		var content = $content[0];
		var noticeTexts = content.querySelectorAll(".spoiler-notice-text");
		var spoilerTexts = content.querySelectorAll(".spoiler-text");
		var hasSpoilingHeadings = Array.prototype.some.call(
			spoilerTexts,
			(el) => el.querySelector("h1,h2,h3,h4,h5,h6") !== null,
		);

		if (noticeTexts.length === 0 || spoilerTexts.length === 0) return;

		var noticeBody = noticeTexts[0].parentElement;
		if (noticeBody.querySelector(".spoiler-toggle-button")) return;

		var tocs = document.querySelectorAll("#toc, .toc");
		if (hasSpoilingHeadings) {
			tocs.forEach((el) => {
				el.style.display = "none";
			});
		}
		content.querySelectorAll(".spoiler-js").forEach((el) => {
			el.style.display = "";
		});

		var anchor = document.createElement("a");
		anchor.textContent = "보이기";
		anchor.classList.add("spoiler-toggle-button");
		anchor.addEventListener("click", function (event) {
			var show = this.textContent === "보이기";
			spoilerTexts.forEach((el) => {
				if (show) {
					el.style.display = el.nodeName === "DIV" ? "block" : "inline";
				}
				el.animate({ opacity: show ? [0, 1] : [1, 0] }, 400).onfinish = () => {
					if (!show) {
						el.style.display = "";
					}
				};
			});
			if (hasSpoilingHeadings) {
				tocs.forEach((el) => {
					el.style.display = show ? "" : "none";
				});
			}
			noticeTexts.forEach((el) => {
				el.style.display = el.style.display === "none" ? "" : "none";
			});

			this.textContent = show ? "숨기기" : "보이기";

			event.preventDefault();
		});
		noticeBody.append(anchor);

		noticeTexts.forEach((el) => {
			el.style.display = el.style.display === "none" ? "" : "none";
		});
	}

	mw.hook("wikipage.content").add(init);
})();
// </nowiki>
