// <nowiki>
"use strict";
(() => {
	const body = document.body;
	// 계정 없는 사람이 편집할 수 있는 주제 문서를 볼 때만 표시 (토론, 특수 문서, 역사 등은 제외)
	if (
		mw.user.isNamed() ||
		!body.classList.contains("mw-editable") ||
		!body.classList.contains("ns-subject") ||
		!body.classList.contains("action-view")
	) {
		return;
	}
	const editLink = document.querySelector("#ca-ve-edit a, #ca-edit a");
	if (!editLink) {
		return;
	}

	const element = document.createElement("button");
	element.type = "button";
	element.classList.add("fw-edit");
	element.title = mw.msg("tooltip-ca-edit");
	element.setAttribute("aria-label", mw.msg("tooltip-ca-edit"));
	const icon = document.createElement("span");
	icon.classList.add("oo-ui-icon-edit");
	element.append(icon);
	// The link's own handlers check the daily limit and open the editor
	element.addEventListener("click", () => editLink.click());

	const content = document.querySelector("#content");
	content.append(element);
	document.documentElement.classList.add("fw-floating-buttons");
})();
// </nowiki>
