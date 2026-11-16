// <nowiki>
"use strict";
(() => {
	const body = document.body;
	// 주제 이름공간의 보기에서만 표시 (토론, 특수 문서, 역사 등은 제외)
	if (
		!body.classList.contains("ns-subject") ||
		!body.classList.contains("action-view")
	) {
		return;
	}
	// 계정 없이도 편집할 수 있으면 편집 링크를 대신 누르고, 편집할 수 없으면 가입을 권한다.
	// 계정이 있는 사람에게는 편집할 수 없는 문서에서만 보인다.
	const editLink = body.classList.contains("mw-editable")
		? document.querySelector("#ca-ve-edit a, #ca-edit a")
		: null;
	if (editLink ? mw.user.isNamed() : body.classList.contains("mw-editable")) {
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
	// OOUI windows load on the first click, not with every page
	element.addEventListener("click", async (_e) => {
		if (editLink) {
			// The link's own handlers check the daily limit and open the editor
			editLink.click();
			return;
		}
		await mw.loader.using("oojs-ui-windows");
		OO.ui
			.confirm("내용을 직접 고칠 수 있습니다.", {
				actions: [
					{
						action: "accept",
						label: OO.ui.deferMsg("userlogin-joinproject"),
						flags: ["primary", "progressive"],
					},
					{
						action: "reject",
						label: OO.ui.deferMsg("ooui-dialog-message-reject"),
						flags: "safe",
					},
				],
			})
			.done((confirmed) => {
				if (confirmed) {
					window.location.href = new mw.Title("Special:CreateAccount").getUrl({
						returnto: mw.config.get("wgPageName"),
					});
				}
			});
	});

	const content = document.querySelector("#content");
	content.append(element);
	document.documentElement.classList.add("fw-floating-buttons");
})();
// </nowiki>
