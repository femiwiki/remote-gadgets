// <nowiki>
(() => {
	"use strict";

	var overlay = null;
	var returnFocus = null;
	var onKeydown = null;

	function close() {
		if (!overlay) {
			return;
		}
		overlay.remove();
		overlay = null;
		document.documentElement.classList.remove("imageview-open");
		document.removeEventListener("keydown", onKeydown);
		if (returnFocus) {
			returnFocus.focus();
		}
	}

	function getFileName(href) {
		var name =
			mw.util.getParamValue("title", href) ||
			decodeURIComponent(href.split("?")[0].split("/").pop());
		var title = mw.Title.newFromText(name);
		return title ? title.getPrefixedText() : null;
	}

	function element(tag, className, attributes) {
		const el = document.createElement(tag);
		el.className = className;
		Object.keys(attributes || {}).forEach((name) => {
			el.setAttribute(name, attributes[name]);
		});
		return el;
	}

	function open(link) {
		var href = link.getAttribute("href");
		var fileName = getFileName(href);
		if (!fileName) {
			return false;
		}
		var label = mw.Title.newFromText(fileName).getMainText();
		var ratio = window.devicePixelRatio || 1;

		returnFocus = link;
		overlay = element("div", "imageview", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": label,
			tabindex: "-1",
		});
		var current = overlay;

		var closeButton = element(
			"button",
			"cdx-button cdx-button--weight-quiet cdx-button--icon-only cdx-button--size-large imageview__close",
			{
				type: "button",
				title: mw.msg("cdx-dialog-close-button-label"),
				"aria-label": mw.msg("cdx-dialog-close-button-label"),
			},
		);
		closeButton.append(element("span", "imageview__close-icon"));
		closeButton.addEventListener("click", close);

		var progress = element("div", "cdx-progress-indicator imageview__progress");
		var indicator = element("div", "cdx-progress-indicator__indicator");
		indicator.append(
			element("progress", "cdx-progress-indicator__indicator__progress", {
				"aria-label": label,
			}),
		);
		progress.append(indicator);

		var linkedImage = link.querySelector("img");
		var image = element("img", "imageview__image", {
			alt: (linkedImage && linkedImage.getAttribute("alt")) || label,
		});

		overlay.append(closeButton, image);
		overlay.addEventListener("click", function (event) {
			if (event.target === this) {
				close();
			}
		});
		document.body.append(overlay);
		document.documentElement.classList.add("imageview-open");
		overlay.focus();

		document.removeEventListener("keydown", onKeydown);
		onKeydown = (event) => {
			if (event.key === "Escape") {
				close();
			} else if (event.key === "Tab") {
				// 닫기 버튼 말고는 누를 것이 없음
				event.preventDefault();
				closeButton.focus();
			}
		};
		document.addEventListener("keydown", onKeydown);

		mw.loader.using("codex-styles").then(() => {
			if (
				overlay === current &&
				!image.classList.contains("imageview__image--loaded")
			) {
				overlay.append(progress);
			}
		});

		new mw.Api()
			.get({
				action: "query",
				titles: fileName,
				prop: "imageinfo",
				iiprop: "url",
				iiurlwidth: Math.round(window.innerWidth * ratio),
				iiurlheight: Math.round(window.innerHeight * ratio),
				formatversion: 2,
			})
			.then((data) => {
				var info = data.query.pages[0].imageinfo;
				if (!info) {
					return Promise.reject();
				}
				image.addEventListener("load", () => {
					progress.remove();
					image.classList.add("imageview__image--loaded");
				});
				image.setAttribute("src", info[0].thumburl || info[0].url);
			})
			.catch(() => {
				if (overlay === current) {
					location.href = href;
				}
			});

		return true;
	}

	document.addEventListener("click", (event) => {
		var link =
			event.target instanceof Element &&
			event.target.closest(".mw-parser-output a.mw-file-description");
		if (
			!link ||
			event.button !== 0 ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey ||
			event.altKey ||
			link.closest(".ve-ce-surface")
		) {
			return;
		}
		if (open(link)) {
			event.preventDefault();
		}
	});
})();
// </nowiki>
