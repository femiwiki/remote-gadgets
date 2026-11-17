// <nowiki>
// GA4 events for MoreToExplore's "더 둘러보기", through the gtag() PageViewInfoGA defines
(() => {
	if (typeof window.gtag !== "function") {
		return;
	}

	const send = (click) => {
		window.gtag("event", "explore_click", {
			link_position: click.position,
			source: click.source,
		});
	};
	mw.hook("ext.moreToExplore.click").add(send);
	// The name before femiwiki/UnifiedExtensionForFemiwiki#329; drop once that is live
	mw.hook("ext.unifiedExtensionForFemiwiki.explore.click").add(send);
})();
// </nowiki>
