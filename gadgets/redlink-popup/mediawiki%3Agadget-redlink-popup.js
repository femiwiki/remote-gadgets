// <nowiki>
// 로그인하지 않은 사람이 빨간 링크를 누르면 편집 화면 대신 안내를 띄웁니다.
// 편집 화면은 권한 안내만 보여 주고, 그 요청은 크롤러와 함께 쓰는 속도 제한에 걸립니다.
(() => {
	"use strict";

	if (mw.config.get("wgUserName") !== null) {
		return;
	}

	var dialog = null;
	var returnFocus = null;

	function element(tag, className, attributes) {
		const el = document.createElement(tag);
		el.className = className;
		Object.keys(attributes || {}).forEach((name) => {
			el.setAttribute(name, attributes[name]);
		});
		return el;
	}

	function getTitle(href) {
		if (mw.util.getParamValue("redlink", href) !== "1") {
			return null;
		}
		return mw.Title.newFromText(mw.util.getParamValue("title", href) || "");
	}

	function button(label, href, primary) {
		var link = element(
			"a",
			"cdx-button cdx-button--fake-button cdx-button--fake-button--enabled" +
				(primary
					? " cdx-button--action-progressive cdx-button--weight-primary"
					: ""),
			{ href: href },
		);
		link.textContent = label;
		return link;
	}

	function close() {
		if (!dialog) {
			return;
		}
		dialog.remove();
		dialog = null;
		document.documentElement.classList.remove("redlink-popup-open");
		document.removeEventListener("keydown", onKeydown);
		if (returnFocus) {
			returnFocus.focus();
		}
	}

	function onKeydown(event) {
		if (event.key === "Escape") {
			close();
		}
	}

	// 사이트 검색은 본문의 낱말을 잘 찾지 못해서, 이 제목을 링크한 문서를 보여 줌
	function listMentions(title, list) {
		var current = mw.config.get("wgPageName").replace(/_/g, " ");
		new mw.Api()
			.get({
				action: "query",
				list: "backlinks",
				bltitle: title.getPrefixedText(),
				blnamespace: 0,
				blfilterredir: "nonredirects",
				bllimit: 6,
				formatversion: 2,
			})
			.then((data) => {
				var results = data.query.backlinks
					.filter((result) => result.title !== current)
					.slice(0, 5);
				if (!list.isConnected || !results.length) {
					return;
				}
				var heading = element("p", "redlink-popup__heading");
				heading.textContent = "이 말이 나오는 다른 문서";
				var items = element("ul", "redlink-popup__results");
				results.forEach((result) => {
					var item = document.createElement("li");
					var link = element("a", "", {
						href: mw.util.getUrl(result.title),
					});
					link.textContent = result.title;
					item.append(link);
					items.append(item);
				});
				list.append(heading, items);
			});
	}

	function open(link, title) {
		returnFocus = link;
		var backdrop = element("div", "cdx-dialog-backdrop redlink-popup");
		var box = element("div", "cdx-dialog", {
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "redlink-popup-title",
			tabindex: "-1",
		});

		var header = element(
			"header",
			"cdx-dialog__header cdx-dialog__header--default",
		);
		var titleGroup = element("div", "cdx-dialog__header__title-group");
		var heading = element("h2", "cdx-dialog__header__title", {
			id: "redlink-popup-title",
		});
		heading.textContent = title.getPrefixedText();
		titleGroup.append(heading);
		var closeButton = element(
			"button",
			"cdx-button cdx-button--weight-quiet cdx-button--icon-only cdx-dialog__header__close-button",
			{
				type: "button",
				title: mw.msg("cdx-dialog-close-button-label"),
				"aria-label": mw.msg("cdx-dialog-close-button-label"),
			},
		);
		closeButton.append(element("span", "redlink-popup__close-icon"));
		closeButton.addEventListener("click", close);
		header.append(titleGroup, closeButton);

		var body = element("div", "cdx-dialog__body");
		var notice = document.createElement("p");
		notice.textContent =
			"아직 없는 문서입니다. 로그인하면 이 문서를 직접 만들 수 있습니다.";
		var mentions = element("div", "redlink-popup__mentions");
		body.append(notice, mentions);

		var footer = element("footer", "cdx-dialog__footer");
		var actions = element("div", "cdx-dialog__footer__actions");
		actions.append(
			button(
				"로그인하고 만들기",
				mw.util.getUrl("Special:UserLogin", {
					returnto: title.getPrefixedText(),
					returntoquery: "action=edit",
				}),
				true,
			),
			button(
				"검색하기",
				mw.util.getUrl("Special:Search", {
					search: title.getPrefixedText(),
					fulltext: 1,
				}),
			),
		);
		footer.append(actions);

		box.append(header, body, footer);
		backdrop.append(box);
		backdrop.addEventListener("click", (event) => {
			if (event.target === backdrop) {
				close();
			}
		});

		close();
		dialog = backdrop;
		document.body.append(backdrop);
		document.documentElement.classList.add("redlink-popup-open");
		document.addEventListener("keydown", onKeydown);
		box.focus();
		listMentions(title, mentions);
	}

	document.addEventListener("click", (event) => {
		var link =
			event.target instanceof Element &&
			event.target.closest("a.new[href]");
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
		var title = getTitle(link.getAttribute("href"));
		if (!title) {
			return;
		}
		event.preventDefault();
		// Codex 스타일은 모든 문서에 싣지 않고 처음 누를 때 불러옴
		mw.loader.using("codex-styles").then(
			() => {
				open(link, title);
			},
			() => {
				location.href = link.href;
			},
		);
	});
})();
// </nowiki>
