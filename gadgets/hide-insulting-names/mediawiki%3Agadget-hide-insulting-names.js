// <nowiki>
(() => {
	"use strict";

	if (mw.config.get("wgCanonicalSpecialPageName") !== "Recentchanges") {
		return;
	}
	var substitute = "<del>(가려짐)</del>";
	var substitute2 = "<i>(이름이 변경됨)</i>";

	mw.hook("wikipage.content").add(() => {
		// ~님에 대한 부적절한 사용자명 변경 건의
		document.querySelectorAll(".mw-changeslist a").forEach((link) => {
			var isLinkToSanction = link.innerHTML.match(
				/님에 대한 부적절한 사용자명 변경 건의/,
			);

			if (isLinkToSanction) {
				link.innerHTML = `사용자:${substitute} 님에 대한 부적절한 사용자명 변경 건의`;
			}
		});

		// 사용자 문서와 사용자 이름 바꾸기 기록
		document
			.querySelectorAll(".mw-changeslist .mw-redirect")
			.forEach((link) => {
				if (link.getAttribute("title").startsWith("사용자:")) {
					if (link.innerHTML.startsWith("사용자:")) {
						link.innerHTML = `사용자:${substitute2}`;
					} else {
						link.innerHTML = substitute2;
					}
				}
			});
	});
})();
// </nowiki>
