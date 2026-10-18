// <nowiki>
"use strict";
// Flow judges a topic's reply box by the topic page, not its retired board
// (edit=flow-archived), so close the forms and say why
(() => {
	const isTopic = mw.config.get("wgNamespaceNumber") === 2600;
	let board = mw.config.get("wgPageName");
	if (isTopic) {
		// Flow puts "< board" in the subtitle of every topic page
		const link = document.querySelector("#mw-content-subtitle a[title]");
		if (!link) {
			return;
		}
		board = link.title;
	}

	const restrictions = isTopic
		? new mw.Api()
				.get({
					action: "query",
					prop: "info",
					inprop: "protection",
					titles: board,
					// The same URL for every reader, so caddy-mwcache can share it
					maxage: 3600,
					smaxage: 3600,
					formatversion: 2,
				})
				.then((data) =>
					(data.query.pages[0].protection || [])
						.filter((p) => p.type === "edit")
						.map((p) => p.level),
				)
		: $.Deferred().resolve(mw.config.get("wgRestrictionEdit") || []);

	restrictions.then((levels) => {
		if (!levels.includes("flow-archived")) {
			return;
		}
		document.body.classList.add("fw-flow-archived");

		const content = document.createElement("div");
		content.className = "cdx-message__content";
		content.append(
			"이 토론은 닫혀서 더 이상 글을 쓸 수 없습니다. 페미위키는 구조화된 토론(Flow)을 그만 쓰기로 하고, 2026년 10월에 게시판의 글을 역사와 함께 일반 위키 문서로 옮겼습니다.",
		);
		// Each board moved to <title>/Flow, and its converted text took <title>
		const converted = board.replace(/_/g, " ").replace(/\/Flow$/, "");
		if (converted !== board.replace(/_/g, " ")) {
			const a = document.createElement("a");
			a.href = mw.util.getUrl(converted);
			a.textContent = converted;
			content.append(" 이어지는 이야기는 ", a, "에 남겨 주세요.");
		}

		const icon = document.createElement("span");
		icon.className = "cdx-message__icon";
		const notice = document.createElement("div");
		notice.className =
			"cdx-message cdx-message--block cdx-message--notice fw-flow-archived-notice";
		notice.append(icon, content);
		document.getElementById("mw-content-text").prepend(notice);
	});
})();
// </nowiki>
