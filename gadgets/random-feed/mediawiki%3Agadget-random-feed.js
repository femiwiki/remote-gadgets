// <nowiki>
// Random pages below the footer, as RelatedArticles cards. Each batch is
// fetched well before the reader reaches it, so the cards are already there.
(() => {
	if (
		mw.config.get("wgIsMainPage") ||
		!mw.config.get("wgArticleId") ||
		!("IntersectionObserver" in window)
	) {
		return;
	}
	const footer = document.querySelector("#footer, .mw-footer");
	if (!footer) {
		return;
	}

	const BATCH_SIZE = 8;
	// The API answer is never cached, so only this many batches load on
	// scroll; after that the reader asks for more with a button.
	const AUTO_BATCHES = 3;
	const api = new mw.Api();
	const seen = new Set([mw.config.get("wgTitle")]);
	const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	const element = (tag, className, text) => {
		const el = document.createElement(tag);
		if (className) {
			el.className = className;
		}
		if (text) {
			el.textContent = text;
		}
		return el;
	};

	const fetchBatch = () =>
		api
			.get({
				action: "query",
				formatversion: 2,
				generator: "random",
				grnnamespace: 0,
				grnfilterredir: "nonredirects",
				// A few spare pages for the ones already shown
				grnlimit: BATCH_SIZE + 4,
				prop: "pageimages|extracts",
				piprop: "thumbnail",
				pithumbsize: 250,
				exintro: 1,
				explaintext: 1,
				exsentences: 1,
				exlimit: BATCH_SIZE + 4,
			})
			.then((data) => {
				const pages = ((data.query && data.query.pages) || [])
					.filter((page) => !seen.has(page.title))
					.slice(0, BATCH_SIZE);
				for (const page of pages) {
					seen.add(page.title);
					// Warm the image cache too, so cards appear whole
					if (page.thumbnail) {
						new Image().src = page.thumbnail.source;
					}
				}
				return pages;
			});

	const card = (page) => {
		const li = element("li");
		li.title = page.title;
		const link = element("a");
		link.href = mw.util.getUrl(page.title);
		const body = element("span", "cdx-card");
		const thumbnail = element("span", "cdx-card__thumbnail cdx-thumbnail");
		if (page.thumbnail) {
			const image = element("span", "cdx-thumbnail__image");
			image.style.backgroundImage = `url(${JSON.stringify(page.thumbnail.source)})`;
			thumbnail.append(image);
		} else {
			const placeholder = element("span", "cdx-thumbnail__placeholder");
			placeholder.append(element("span", "cdx-thumbnail__placeholder__icon"));
			thumbnail.append(placeholder);
		}
		const text = element("span", "cdx-card__text");
		text.append(element("span", "cdx-card__text__title", page.title));
		if (page.extract) {
			text.append(element("span", "cdx-card__text__description", page.extract));
		}
		body.append(thumbnail, text);
		link.append(body);
		li.append(link);
		return li;
	};

	const skeleton = () => {
		const li = element("li", "fw-random-feed-skeleton");
		li.setAttribute("aria-hidden", "true");
		const body = element("span", "cdx-card");
		const thumbnail = element("span", "cdx-card__thumbnail cdx-thumbnail");
		thumbnail.append(element("span", "cdx-thumbnail__placeholder"));
		const text = element("span", "cdx-card__text");
		for (let i = 0; i < 3; i++) {
			text.append(element("span", "fw-random-feed-bar"));
		}
		body.append(thumbnail, text);
		li.append(body);
		return li;
	};

	// The section goes in at once, so the random page link has a target;
	// cards come only when the reader nears it.
	const section = element("section", "fw-random-feed noprint");
	section.setAttribute("aria-labelledby", "fw-random-feed-heading");
	const container = element(
		"div",
		"read-more-container read-more-container-large",
	);
	const aside = element("aside");
	const heading = element(
		"h2",
		"read-more-container-heading",
		mw.msg("gadget-random-feed-heading"),
	);
	heading.id = "fw-random-feed-heading";
	heading.tabIndex = -1;
	heading.append(element("span", "fw-random-feed-label", mw.msg("randompage")));
	const list = element("ul", "read-more-container-card-list");
	const skeletons = [skeleton(), skeleton()];
	list.append(...skeletons);
	const sentinel = element("div", "fw-random-feed-sentinel");
	const more = element(
		"button",
		"fw-random-feed-more",
		mw.msg("gadget-random-feed-more"),
	);
	more.type = "button";
	more.hidden = true;
	aside.append(heading, list, sentinel, more);
	container.append(aside);
	section.append(container);
	footer.after(section);
	// Line up with the footer, whose gutters the skin sets by width
	const matchFooter = () => {
		const style = getComputedStyle(footer);
		for (const property of [
			"paddingLeft",
			"paddingRight",
			"marginLeft",
			"marginRight",
			"maxWidth",
		]) {
			section.style[property] = style[property];
		}
		section.style.boxSizing = "border-box";
		section.style.width = `${footer.getBoundingClientRect().width}px`;
	};
	matchFooter();
	new ResizeObserver(matchFooter).observe(footer);

	const queue = [];
	let fetched = 0;
	let shown = 0;
	let busy = false;

	const fetchInto = () => {
		const batch = fetchBatch();
		// A batch fetched ahead may fail unseen; showNext() handles it if shown
		batch.catch(() => {});
		queue.push(batch);
		fetched++;
		return batch;
	};

	// The batches that load on scroll come in a row, each asked for as soon
	// as the one before arrives, so a fast reader does not outrun them. The
	// button's batch is fetched once the button is near.
	let chaining = false;
	const fetchAhead = () => {
		if (fetched >= AUTO_BATCHES) {
			chaining = false;
			return;
		}
		chaining = true;
		fetchInto().then(fetchAhead, () => {
			chaining = false;
		});
	};
	const prefetch = () => {
		if (fetched < AUTO_BATCHES) {
			if (!chaining) {
				fetchAhead();
			}
		} else if (shown >= AUTO_BATCHES && queue.length === 0) {
			fetchInto();
		}
	};

	const showNext = () => {
		if (busy) {
			return;
		}
		busy = true;
		section.setAttribute("aria-busy", "true");
		prefetch();
		const batch = queue.shift();
		const settle = () => {
			busy = false;
			section.removeAttribute("aria-busy");
		};
		batch.then(
			(pages) => {
				// Cards the RelatedArticles list already shows
				for (const li of document.querySelectorAll(
					".read-more-container-card-list li[title]",
				)) {
					if (!section.contains(li)) {
						seen.add(li.title);
					}
				}
				for (const page of pages) {
					list.insertBefore(card(page), skeletons[0]);
				}
				shown++;
				settle();
				if (shown < AUTO_BATCHES) {
					prefetch();
				} else {
					for (const s of skeletons) {
						s.hidden = true;
					}
					more.hidden = false;
				}
				// Look again: the sentinel may still be in range
				observer.unobserve(sentinel);
				observer.observe(sentinel);
			},
			() => {
				settle();
				for (const s of skeletons) {
					s.hidden = true;
				}
				more.hidden = false;
			},
		);
	};

	const observer = new IntersectionObserver(
		(entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) {
				return;
			}
			if (shown < AUTO_BATCHES) {
				showNext();
			} else {
				prefetch();
			}
		},
		{ rootMargin: "0px 0px 200% 0px" },
	);
	observer.observe(sentinel);

	// The API takes over a second, so fetch the first batch five screens early
	const early = new IntersectionObserver(
		(entries) => {
			if (entries.some((entry) => entry.isIntersecting)) {
				early.disconnect();
				prefetch();
			}
		},
		{ rootMargin: "0px 0px 500% 0px" },
	);
	early.observe(footer);

	more.addEventListener("click", () => {
		more.hidden = true;
		for (const s of skeletons) {
			s.hidden = false;
		}
		showNext();
	});

	// While the feed fills the screen, a bubble leads back to the footer
	const back = element("button", "fw-random-feed-back");
	back.type = "button";
	back.hidden = true;
	const arrow = element("span", null, "↑");
	arrow.setAttribute("aria-hidden", "true");
	back.append(arrow, ` ${mw.msg("gadget-random-feed-back")}`);
	document.body.append(back);
	footer.tabIndex = -1;
	back.addEventListener("click", () => {
		footer.scrollIntoView({
			behavior: smooth ? "smooth" : "auto",
			block: "end",
		});
		footer.focus({ preventScroll: true });
	});
	let ticking = false;
	const updateBack = () => {
		ticking = false;
		// Once the footer has gone off the top, the feed fills the screen
		back.hidden = footer.getBoundingClientRect().bottom > 0;
	};
	window.addEventListener(
		"scroll",
		() => {
			if (!ticking) {
				ticking = true;
				requestAnimationFrame(updateBack);
			}
		},
		{ passive: true },
	);

	// The random page link scrolls down to the feed instead. New tabs, other
	// pages and readers without JavaScript still get Special:Random.
	document.addEventListener("click", (ev) => {
		if (
			ev.defaultPrevented ||
			ev.button !== 0 ||
			ev.ctrlKey ||
			ev.metaKey ||
			ev.shiftKey ||
			ev.altKey
		) {
			return;
		}
		if (!ev.target.closest("li.random a, #n-randompage a")) {
			return;
		}
		ev.preventDefault();
		if (shown === 0) {
			showNext();
		}
		section.scrollIntoView({
			behavior: smooth ? "smooth" : "auto",
			block: "start",
		});
		heading.focus({ preventScroll: true });
		// RelatedArticles and lazy images above still change height during and
		// after the scroll, so hold the feed in place for a moment, until the
		// reader scrolls on their own.
		const land = () => section.scrollIntoView({ block: "start" });
		const pin = new ResizeObserver(land);
		const unpin = () => {
			pin.disconnect();
			for (const type of ["wheel", "touchstart", "keydown"]) {
				window.removeEventListener(type, unpin);
			}
		};
		const hold = () => {
			pin.observe(document.body);
			for (const type of ["wheel", "touchstart", "keydown"]) {
				window.addEventListener(type, unpin, { passive: true });
			}
			setTimeout(unpin, 3000);
		};
		if (smooth && "onscrollend" in window) {
			window.addEventListener("scrollend", hold, { once: true });
		} else {
			setTimeout(hold, smooth ? 1000 : 0);
		}
	});
})();
// </nowiki>
