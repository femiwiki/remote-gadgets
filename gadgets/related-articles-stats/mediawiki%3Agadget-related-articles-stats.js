// <nowiki>
// GA4 events for MoreToExplore's "더 둘러보기", through the gtag() PageViewInfoGA defines
(() => {
	if (typeof window.gtag !== "function") {
		return;
	}

	mw.hook("ext.moreToExplore.click").add((click) => {
		window.gtag("event", "explore_click", {
			link_position: click.position,
			source: click.source,
		});
	});
})();
// </nowiki>
