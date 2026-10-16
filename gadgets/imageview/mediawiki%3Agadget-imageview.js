// <nowiki>
(() => {
	"use strict";

	var overlay = null;
	var returnFocus = null;

	function close() {
		if (!overlay) {
			return;
		}
		overlay.remove();
		overlay = null;
		document.documentElement.classList.remove("imageview-open");
		$(document).off("keydown.imageview");
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

	function open(link) {
		var href = link.getAttribute("href");
		var fileName = getFileName(href);
		if (!fileName) {
			return false;
		}
		var label = mw.Title.newFromText(fileName).getMainText();
		var ratio = window.devicePixelRatio || 1;

		returnFocus = link;
		overlay = $("<div>").addClass("imageview").attr({
			role: "dialog",
			"aria-modal": "true",
			"aria-label": label,
			tabindex: "-1",
		});
		var current = overlay;

		var closeButton = $("<button>")
			.attr({
				type: "button",
				title: mw.msg("cdx-dialog-close-button-label"),
				"aria-label": mw.msg("cdx-dialog-close-button-label"),
			})
			.addClass(
				"cdx-button cdx-button--weight-quiet cdx-button--icon-only cdx-button--size-large imageview__close",
			)
			.append($("<span>").addClass("imageview__close-icon"))
			.on("click", close);

		var progress = $("<div>")
			.addClass("cdx-progress-indicator imageview__progress")
			.append(
				$("<div>")
					.addClass("cdx-progress-indicator__indicator")
					.append(
						$("<progress>")
							.addClass("cdx-progress-indicator__indicator__progress")
							.attr("aria-label", label),
					),
			);

		var image = $("<img>")
			.addClass("imageview__image")
			.attr("alt", $(link).find("img").attr("alt") || label);

		overlay
			.append(closeButton, image)
			.on("click", function (event) {
				if (event.target === this) {
					close();
				}
			})
			.appendTo(document.body);
		document.documentElement.classList.add("imageview-open");
		overlay.trigger("focus");

		$(document).on("keydown.imageview", (event) => {
			if (event.key === "Escape") {
				close();
			} else if (event.key === "Tab") {
				// 닫기 버튼 말고는 누를 것이 없음
				event.preventDefault();
				closeButton.trigger("focus");
			}
		});

		mw.loader.using("codex-styles").then(() => {
			if (overlay === current && !image.hasClass("imageview__image--loaded")) {
				progress.appendTo(overlay);
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
					return $.Deferred().reject();
				}
				image
					.on("load", () => {
						progress.remove();
						image.addClass("imageview__image--loaded");
					})
					.attr("src", info[0].thumburl || info[0].url);
			})
			.catch(() => {
				if (overlay === current) {
					location.href = href;
				}
			});

		return true;
	}

	$(document).on(
		"click",
		".mw-parser-output a.mw-file-description",
		function (event) {
			if (
				event.button !== 0 ||
				event.ctrlKey ||
				event.metaKey ||
				event.shiftKey ||
				event.altKey ||
				$(this).closest(".ve-ce-surface").length
			) {
				return;
			}
			if (open(this)) {
				event.preventDefault();
			}
		},
	);
})();
// </nowiki>
