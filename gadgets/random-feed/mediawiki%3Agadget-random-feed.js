// <nowiki>
// Random pages below the footer as RelatedArticles cards, fetched ahead of the reader
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

	// TextExtracts gives at most 20 extracts a request
	const BATCH_SIZE = 20;
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

	const fetchBatch = () => {
		// Nor the cards the RelatedArticles list shows by now
		for (const li of document.querySelectorAll(
			".read-more-container-card-list li[title]",
		)) {
			seen.add(li.title);
		}
		return api
			.get({
				action: "query",
				formatversion: 2,
				generator: "random",
				grnnamespace: 0,
				grnfilterredir: "nonredirects",
				grnlimit: BATCH_SIZE,
				prop: "pageimages|extracts",
				piprop: "thumbnail",
				pithumbsize: 250,
				exintro: 1,
				explaintext: 1,
				exsentences: 1,
				exlimit: BATCH_SIZE,
			})
			.then((data) => {
				const pages = ((data.query && data.query.pages) || []).filter(
					(page) => !seen.has(page.title),
				);
				for (const page of pages) {
					seen.add(page.title);
					if (page.thumbnail) {
						new Image().src = page.thumbnail.source;
					}
				}
				return pages;
			});
	};

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

	// The section goes in at once, so the random page link has a target
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
	const batches = element("div", "fw-random-feed-batches");
	const pending = element(
		"ul",
		"read-more-container-card-list fw-random-feed-pending",
	);
	pending.append(skeleton(), skeleton());
	const sentinel = element("div", "fw-random-feed-sentinel");
	// Only after a failed request, to try again
	const retry = element(
		"button",
		"fw-random-feed-more",
		mw.msg("gadget-random-feed-more"),
	);
	retry.type = "button";
	retry.hidden = true;
	aside.append(heading, batches, pending, sentinel, retry);
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

	// Batches far off screen give up their cards and keep only their height,
	// so the page stays light however far the reader goes
	const pagesOf = new Map();
	const unloader = new IntersectionObserver(
		(entries) => {
			for (const { target, isIntersecting } of entries) {
				const empty = !target.firstChild;
				if (isIntersecting && empty) {
					target.append(...pagesOf.get(target).map(card));
					target.style.height = "";
				} else if (!isIntersecting && !empty) {
					target.style.height = `${target.offsetHeight}px`;
					target.replaceChildren();
				}
			}
		},
		{ rootMargin: "300% 0px" },
	);

	// Two batches in hand: each asked for as soon as the one before arrives
	const queue = [];
	let chaining = false;
	const fetchAhead = () => {
		if (queue.length >= 2) {
			chaining = false;
			return;
		}
		chaining = true;
		const batch = fetchBatch();
		// A batch fetched ahead may fail unseen; showNext() handles it if shown
		batch.catch(() => {});
		queue.push(batch);
		batch.then(fetchAhead, () => {
			chaining = false;
		});
	};
	const prefetch = () => {
		if (!chaining) {
			fetchAhead();
		}
	};

	let busy = false;
	let stopped = false;
	const showNext = () => {
		if (busy || stopped) {
			return;
		}
		busy = true;
		section.setAttribute("aria-busy", "true");
		prefetch();
		const batch = queue.shift();
		prefetch();
		const settle = () => {
			busy = false;
			section.removeAttribute("aria-busy");
		};
		batch.then(
			(pages) => {
				const list = element("ul", "read-more-container-card-list");
				pagesOf.set(list, pages);
				list.append(...pages.map(card));
				batches.append(list);
				unloader.observe(list);
				settle();
				// Look again: the sentinel may still be in range
				observer.unobserve(sentinel);
				observer.observe(sentinel);
			},
			() => {
				settle();
				stopped = true;
				pending.hidden = true;
				retry.hidden = false;
			},
		);
	};

	const observer = new IntersectionObserver(
		(entries) => {
			if (entries.some((entry) => entry.isIntersecting)) {
				showNext();
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

	retry.addEventListener("click", () => {
		retry.hidden = true;
		pending.hidden = false;
		stopped = false;
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
		if (!batches.firstChild) {
			showNext();
		}
		section.scrollIntoView({
			behavior: smooth ? "smooth" : "auto",
			block: "start",
		});
		heading.focus({ preventScroll: true });
		// RelatedArticles and lazy images above still grow after the scroll, so
		// hold the feed in place until the reader scrolls on their own
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
