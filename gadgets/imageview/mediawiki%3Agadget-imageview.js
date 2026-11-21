// <nowiki>
(() => {
	"use strict";

	var LINK_SELECTOR = ".mw-parser-output a.mw-file-description";
	// 이만큼 옆으로 밀면 앞뒤 이미지로 넘어감
	var SWIPE_THRESHOLD = 50;
	var MIN_SIZE = 64;

	// 파일 이름 → 이미지 주소 Promise
	var urls = new Map();

	var overlay = null;
	var state = null;

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

	function iconButton(className, iconClassName, label) {
		var button = element(
			"button",
			"cdx-button cdx-button--weight-quiet cdx-button--icon-only cdx-button--size-large " +
				className,
			{ type: "button", title: label, "aria-label": label },
		);
		button.append(element("span", "imageview__icon " + iconClassName));
		return button;
	}

	// 아이콘처럼 작은 그림은 넘겨 보는 목록에 넣지 않음
	function isPhoto(link) {
		var image = link.querySelector("img");
		return (
			!!image &&
			image.getClientRects().length > 0 &&
			image.width >= MIN_SIZE &&
			image.height >= MIN_SIZE
		);
	}

	function collectItems(clicked) {
		var links = isPhoto(clicked)
			? Array.from(document.querySelectorAll(LINK_SELECTOR)).filter(
					(link) =>
						link === clicked ||
						(isPhoto(link) && !link.closest(".ve-ce-surface")),
				)
			: [clicked];
		return links
			.map((link) => {
				var href = link.getAttribute("href");
				var fileName = href && getFileName(href);
				if (!fileName) {
					return null;
				}
				var linkedImage = link.querySelector("img");
				var label = mw.Title.newFromText(fileName).getMainText();
				return {
					link: link,
					href: href,
					fileName: fileName,
					label: label,
					alt: (linkedImage && linkedImage.getAttribute("alt")) || label,
				};
			})
			.filter(Boolean);
	}

	// 아직 모르는 파일들의 주소를 한 번에 가져옴
	function fetchUrls(fileNames) {
		var missing = fileNames.filter(
			(name, i) => !urls.has(name) && fileNames.indexOf(name) === i,
		);
		if (missing.length) {
			var ratio = window.devicePixelRatio || 1;
			var request = new mw.Api()
				.get({
					action: "query",
					titles: missing,
					prop: "imageinfo",
					iiprop: "url",
					iiurlwidth: Math.round(window.innerWidth * ratio),
					iiurlheight: Math.round(window.innerHeight * ratio),
					formatversion: 2,
				})
				.then((data) => {
					var found = {};
					data.query.pages.forEach((page) => {
						var info = page.imageinfo;
						if (info) {
							found[page.title] = info[0].thumburl || info[0].url;
						}
					});
					(data.query.normalized || []).forEach((n) => {
						if (found[n.to]) {
							found[n.from] = found[n.to];
						}
					});
					return found;
				});
			missing.forEach((name) => {
				var url = request.then((found) =>
					found[name] ? found[name] : Promise.reject(),
				);
				// 실패한 요청은 다음에 다시 시도
				url.catch(() => {
					if (urls.get(name) === url) {
						urls.delete(name);
					}
				});
				urls.set(name, url);
			});
		}
		return fileNames.map((name) => urls.get(name));
	}

	function preload(index) {
		var item = state.items[index];
		if (!item) {
			return;
		}
		fetchUrls([item.fileName])[0]
			.then((url) => {
				new Image().src = url;
			})
			.catch(() => {});
	}

	function show(index) {
		var item = state.items[index];
		state.index = index;

		overlay.setAttribute("aria-label", item.label);
		state.prevButton.hidden = index === 0;
		state.nextButton.hidden = index === state.items.length - 1;
		state.counter.textContent =
			state.items.length > 1 ? index + 1 + " / " + state.items.length : "";

		var image = element("img", "imageview__image", { alt: item.alt });
		if (state.image) {
			state.image.replaceWith(image);
		} else {
			overlay.append(image);
		}
		state.image = image;
		state.progress.remove();
		state.progress
			.querySelector("progress")
			.setAttribute("aria-label", item.label);

		mw.loader.using("codex-styles").then(() => {
			if (
				state &&
				state.image === image &&
				!image.classList.contains("imageview__image--loaded")
			) {
				overlay.append(state.progress);
			}
		});

		// 지금 이미지와 앞뒤 이미지의 주소를 같이 가져옴
		var neighbors = [index - 1, index + 1].filter(
			(i) => i >= 0 && i < state.items.length,
		);
		fetchUrls(
			[item.fileName].concat(neighbors.map((i) => state.items[i].fileName)),
		)[0]
			.then((url) => {
				image.addEventListener("load", () => {
					if (state && state.image === image) {
						state.progress.remove();
					}
					image.classList.add("imageview__image--loaded");
				});
				image.setAttribute("src", url);
				neighbors.forEach(preload);
			})
			.catch(() => {
				if (state && state.image === image) {
					location.href = item.href;
				}
			});
	}

	function go(delta) {
		var index = state.index + delta;
		if (index >= 0 && index < state.items.length) {
			show(index);
		}
	}

	function teardown() {
		if (!overlay) {
			return;
		}
		var returnFocus = state.items[state.index].link;
		overlay.remove();
		overlay = null;
		state = null;
		document.documentElement.classList.remove("imageview-open");
		document.removeEventListener("keydown", onKeydown);
		window.removeEventListener("popstate", teardown);
		returnFocus.focus({ preventScroll: true });
	}

	// 뒤로 가기로 닫히도록 열 때 기록을 하나 쌓았으므로, 닫을 때 그 기록을 되돌림
	function close() {
		if (!overlay || state.closing) {
			return;
		}
		state.closing = true;
		if (history.state && history.state.imageview) {
			history.back();
		} else {
			teardown();
		}
	}

	function onKeydown(event) {
		if (event.key === "Escape") {
			close();
		} else if (event.key === "ArrowLeft") {
			event.preventDefault();
			go(-1);
		} else if (event.key === "ArrowRight") {
			event.preventDefault();
			go(1);
		} else if (event.key === "Tab") {
			// 대화 상자 안의 버튼만 돌아가며 누름
			var buttons = Array.from(overlay.querySelectorAll("button")).filter(
				(button) => button.offsetParent !== null,
			);
			var i = buttons.indexOf(document.activeElement);
			var next = i + (event.shiftKey ? -1 : 1);
			event.preventDefault();
			buttons[(next + buttons.length) % buttons.length].focus();
		}
	}

	function addSwipe() {
		var start = null;

		function reset() {
			if (start && state && state.image) {
				state.image.style.transform = "";
			}
			start = null;
		}

		overlay.addEventListener("pointerdown", (event) => {
			// 손가락 두 개로 확대한 상태에서는 화면 이동을 방해하지 않음
			if (
				event.pointerType === "mouse" ||
				!event.isPrimary ||
				(window.visualViewport && window.visualViewport.scale > 1.01)
			) {
				return;
			}
			start = { x: event.clientX, y: event.clientY, dx: 0 };
		});
		overlay.addEventListener("pointermove", (event) => {
			if (!start || !event.isPrimary) {
				return;
			}
			var dx = event.clientX - start.x;
			if (Math.abs(dx) < Math.abs(event.clientY - start.y)) {
				return;
			}
			var atEdge =
				(dx > 0 && state.index === 0) ||
				(dx < 0 && state.index === state.items.length - 1);
			start.dx = dx;
			state.image.style.transform =
				"translateX(" + (atEdge ? dx / 4 : dx) + "px)";
		});
		overlay.addEventListener("pointerup", (event) => {
			if (!start || !event.isPrimary) {
				return;
			}
			var dx = start.dx;
			reset();
			if (Math.abs(dx) > 10) {
				// 밀고 나서 손을 뗀 것을 바탕을 누른 것으로 보지 않음
				state.suppressClick = true;
				setTimeout(() => {
					if (state) {
						state.suppressClick = false;
					}
				});
			}
			if (Math.abs(dx) > SWIPE_THRESHOLD) {
				go(dx < 0 ? 1 : -1);
			}
		});
		overlay.addEventListener("pointercancel", reset);
	}

	function open(link) {
		var items = collectItems(link);
		var index = items.findIndex((item) => item.link === link);
		if (index === -1) {
			return false;
		}

		overlay = element("div", "imageview", {
			role: "dialog",
			"aria-modal": "true",
			tabindex: "-1",
		});

		var closeLabel = mw.msg("cdx-dialog-close-button-label");
		var closeButton = iconButton(
			"imageview__close",
			"imageview__icon--close",
			closeLabel,
		);
		closeButton.addEventListener("click", close);

		var prevButton = iconButton(
			"imageview__prev",
			"imageview__icon--prev",
			mw.msg("mobile-frontend-media-prev"),
		);
		prevButton.addEventListener("click", () => go(-1));

		var nextButton = iconButton(
			"imageview__next",
			"imageview__icon--next",
			mw.msg("mobile-frontend-media-next"),
		);
		nextButton.addEventListener("click", () => go(1));

		var counter = element("div", "imageview__counter", {
			"aria-live": "polite",
		});

		var progress = element("div", "cdx-progress-indicator imageview__progress");
		var indicator = element("div", "cdx-progress-indicator__indicator");
		indicator.append(
			element("progress", "cdx-progress-indicator__indicator__progress", {
				"aria-label": items[index].label,
			}),
		);
		progress.append(indicator);

		state = {
			items: items,
			index: index,
			image: null,
			progress: progress,
			counter: counter,
			prevButton: prevButton,
			nextButton: nextButton,
			closing: false,
			suppressClick: false,
		};

		overlay.append(counter, closeButton, prevButton, nextButton);
		overlay.addEventListener("click", function (event) {
			if (event.target === this && !state.suppressClick) {
				close();
			}
		});
		addSwipe();
		document.body.append(overlay);
		document.documentElement.classList.add("imageview-open");
		overlay.focus();

		document.addEventListener("keydown", onKeydown);
		history.pushState({ imageview: true }, "");
		window.addEventListener("popstate", teardown);

		show(index);
		return true;
	}

	document.addEventListener("click", (event) => {
		var link = event.target instanceof Element && event.target.closest(LINK_SELECTOR);
		if (
			!link ||
			overlay ||
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
