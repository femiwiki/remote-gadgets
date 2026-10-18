// <nowiki>
"use strict";
// MediaWiki:Anonnotice is only this placeholder, so the cached page HTML
// never carries a stale notice (docker-mediawiki#318)
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
