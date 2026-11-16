// <nowiki>
// GA4 events for UnifiedExtensionForFemiwiki's "더 둘러보기", through the gtag() PageViewInfoGA defines
(() => {
	if (typeof window.gtag !== "function") {
		return;
	}

	mw.hook("ext.unifiedExtensionForFemiwiki.explore.click").add((click) => {
		window.gtag("event", "explore_click", {
			link_position: click.position,
			source: click.source,
		});
	});
})();
// </nowiki>
