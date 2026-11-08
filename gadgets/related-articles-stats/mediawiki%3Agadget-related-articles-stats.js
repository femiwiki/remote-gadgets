// <nowiki>
// Sends two Google Analytics events so the click-through rate of the
// RelatedArticles cards ("더 읽을거리") at the end of an article can be
// measured: related_articles_view when at least half of the card list is on
// screen, and related_articles_click when a card is followed. The Google tag
// itself comes from PageViewInfoGA, so nothing is sent where it is not loaded.
(() => {
	const container = document.querySelector(".read-more-container");
	if (!container || typeof window.gtag !== "function") {
		return;
	}

	const LIST_SELECTOR = ".read-more-container-card-list";

	const cardLinks = () =>
		Array.from(container.querySelectorAll(`${LIST_SELECTOR} a`));

	container.addEventListener("click", (ev) => {
		const link = ev.target.closest(`${LIST_SELECTOR} a`);
		if (!link) {
			return;
		}
		const cards = cardLinks();
		window.gtag("event", "related_articles_click", {
			link_position: cards.indexOf(link) + 1,
			card_count: cards.length,
		});
	});

	const watchList = (list) => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) {
					return;
				}
				observer.disconnect();
				window.gtag("event", "related_articles_view", {
					card_count: cardLinks().length,
				});
			},
			{ threshold: 0.5 },
		);
		observer.observe(list);
	};

	// RelatedArticles fills the container only when the reader scrolls near it.
	const list = container.querySelector(LIST_SELECTOR);
	if (list) {
		watchList(list);
		return;
	}
	const mutationObserver = new MutationObserver(() => {
		const renderedList = container.querySelector(LIST_SELECTOR);
		if (renderedList) {
			mutationObserver.disconnect();
			watchList(renderedList);
		}
	});
	mutationObserver.observe(container, { childList: true, subtree: true });
})();
// </nowiki>
