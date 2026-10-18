// <nowiki>
"use strict";
// Logged-out readers get page HTML from caddy-mwcache, which keeps it for
// $wgCdnMaxAge (5 hours) and is not purged when MediaWiki:Sitenotice is
// saved. So MediaWiki:Anonnotice holds only an empty placeholder, which the
// skin shows logged-out readers instead of MediaWiki:Sitenotice, and this
// fills it with the current MediaWiki:Sitenotice. The API response is cached
// for 5 minutes, so an edit reaches readers within about that long, the way
// CentralNotice fetches its banners outside the cached HTML.
// https://github.com/femiwiki/docker-mediawiki/issues/318
(() => {
	const placeholder = document.getElementById("fw-anon-sitenotice");
	if (!placeholder) {
		return;
	}

	new mw.Api()
		.get({
			action: "parse",
			page: "MediaWiki:Sitenotice",
			prop: "text|modules|modulestyles",
			wrapoutputclass: "",
			disablelimitreport: true,
			disableeditsection: true,
			uselang: "content",
			// The same URL for every reader, so caddy-mwcache can share it
			maxage: 300,
			smaxage: 300,
			formatversion: 2,
		})
		.then((data) => {
			const parse = data.parse;
			const notice = placeholder.closest("#localNotice") || placeholder;
			// An empty message parses to nothing, or to "-" which disables it
			const text = parse.text.trim();
			if (text === "" || text === "<p>-\n</p>") {
				notice.remove();
				return;
			}
			mw.loader.load(parse.modulestyles.concat(parse.modules));
			placeholder.innerHTML = text;
			mw.hook("wikipage.content").fire($(placeholder));
		});
})();
// </nowiki>
