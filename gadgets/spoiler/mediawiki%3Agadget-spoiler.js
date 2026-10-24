// <nowiki>
/**
 * [[틀:스포일러]] 를 보조합니다
 */
(() => {
	"use strict";

	function isHidden(el) {
		return window.getComputedStyle(el).display === "none";
	}

	// The display an element of this tag has when no style hides it
	function defaultDisplay(el) {
		const probe = document.createElement(el.nodeName);
		document.body.append(probe);
		const display = window.getComputedStyle(probe).display;
		probe.remove();
		return display === "none" ? "block" : display;
	}

	function show(el) {
		el.style.display = "";
		if (isHidden(el)) {
			el.style.display = defaultDisplay(el);
		}
	}

	function hide(el) {
		el.style.display = "none";
	}

	function toggle(el) {
		if (isHidden(el)) {
			show(el);
		} else {
			hide(el);
		}
	}

	// Whether each spoiler is shown, and its running fade
	const fades = new WeakMap();

	// jQuery's fadeToggle() with its default 400 ms
	function fadeToggle(el) {
		const last = fades.get(el);
		const fadeIn = last ? !last.shown : isHidden(el);
		if (last) {
			last.animation.cancel();
		}
		if (fadeIn) {
			show(el);
		}
		const animation = el.animate(
			{ opacity: fadeIn ? [0, 1] : [1, 0] },
			{ duration: 400, easing: "ease-in-out", fill: "forwards" },
		);
		animation.onfinish = () => {
			if (!fadeIn) {
				hide(el);
			}
			animation.cancel();
		};
		fades.set(el, { shown: fadeIn, animation: animation });
	}

	function init($content) {
		const roots = Array.prototype.slice.call($content);
		const find = (selector) => {
			const found = [];
			roots.forEach((root) => {
				root.querySelectorAll(selector).forEach((el) => {
					if (found.indexOf(el) === -1) {
						found.push(el);
					}
				});
			});
			return found;
		};
		var noticeTexts = find(".spoiler-notice-text");
		var spoilerTexts = find(".spoiler-text");
		var hasSpoilingHeadings = spoilerTexts.some(
			(el) => el.querySelector("h1,h2,h3,h4,h5,h6") !== null,
		);

		if (noticeTexts.length === 0 || spoilerTexts.length === 0) return;

		var noticeBody = noticeTexts[0].parentElement;
		if (noticeBody.querySelector(".spoiler-toggle-button")) return;

		var tocs = document.querySelectorAll("#toc, .toc");
		if (hasSpoilingHeadings) {
			tocs.forEach(hide);
		}
		find(".spoiler-js").forEach(show);

		var anchor = document.createElement("a");
		anchor.textContent = "보이기";
		anchor.classList.add("spoiler-toggle-button");
		anchor.addEventListener("click", function (event) {
			spoilerTexts.forEach(fadeToggle);
			if (hasSpoilingHeadings) {
				tocs.forEach(toggle);
			}
			noticeTexts.forEach(toggle);

			if (this.textContent === "숨기기") {
				this.textContent = "보이기";
			} else {
				this.textContent = "숨기기";
			}

			event.preventDefault();
		});
		noticeBody.append(anchor);

		noticeTexts.forEach(toggle);
	}

	mw.hook("wikipage.content").add(init);
})();
// </nowiki>
