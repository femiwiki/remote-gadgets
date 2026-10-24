/**
 * [[틀:책날개]]를 보조합니다.
 */
// <nowiki>
(() => {
	var raws = document.querySelectorAll(".book-flap-raw");
	if (
		mw.config.get("skin") !== "femiwiki" ||
		raws.length === 0 ||
		mw.config.get("wgPageContentModel") === "flow-board"
	)
		return;

	// FemiwikiSkin 6 draws the ToC outside the content and leaves a right column
	// (FemiwikiSkin#348), so 책날개 goes there instead of buttons in the content.
	if (!document.getElementById("fw-page-aside")) return;
	outsideContent();

	function element(tag, className, attributes) {
		const el = document.createElement(tag);
		if (className) el.className = className;
		Object.keys(attributes || {}).forEach((name) => {
			el.setAttribute(name, attributes[name]);
		});
		return el;
	}

	function makeCollapsible(root) {
		root.querySelectorAll(".book-flap-body > ul > li").forEach((li) => {
			const hidable = Array.prototype.filter.call(
				li.children,
				(child) => child.tagName === "UL",
			);
			if (hidable.length === 0) return;

			const button = element("div", "bookflap-collapse-button");
			button.textContent = "▼";
			button.addEventListener("click", () => {
				hidable.forEach((ul) => {
					ul.style.display = ul.style.display === "none" ? "" : "none";
				});
			});
			li.prepend(button);

			if (!li.querySelector(".mw-selflink")) {
				hidable.forEach((ul) => {
					ul.style.display = "none";
				});
			}
		});
	}

	/**
	 * Wide screens show 책날개 in the right column, unless the reader folded it
	 * away (FemiwikiSkin's fw-aside-pinned client preference). Elsewhere it is a
	 * "둘러보기" tab in the ToC drawer, or a drawer of its own where the ToC is a
	 * column or there is no ToC.
	 */
	function outsideContent() {
		var body = document.body;
		body.classList.add("book-flap-outside");
		var aside = element("div", "book-flap-aside skin-fw-unprintable");
		document.getElementById("fw-page-aside").append(aside);
		var pane = element("div", "book-flap-pane");

		raws.forEach((raw) => {
			[aside, pane].forEach((target) => {
				const title = element("div", "book-flap-title");
				raw
					.querySelectorAll(".book-flap-title a, .book-flap-title .mw-selflink")
					.forEach((link) => {
						title.append(link.cloneNode(true));
					});
				const flap = element("div", "book-flap-side");
				flap.append(title);
				raw.querySelectorAll(".book-flap-body").forEach((flapBody) => {
					const clone = flapBody.cloneNode(true);
					clone.classList.add("mw-parser-output");
					flap.append(clone);
				});
				target.append(flap);
				if (raw.classList.contains("book-flap-collapsible")) {
					makeCollapsible(flap);
				}
			});
		});

		// The skin saves the choice on a click on these (FemiwikiSkin pinning.js).
		function pinButton(className, value, msg) {
			return element("button", `fw-pin-button ${className}`, {
				type: "button",
				"data-fw-pin": "aside",
				"data-fw-pin-value": value,
				title: mw.msg(msg),
				"aria-label": mw.msg(msg),
			});
		}
		var asideTitle = aside.querySelector(".book-flap-title");
		if (asideTitle) {
			asideTitle.append(
				pinButton("fw-pin-hide-end", "0", "skin-femiwiki-pin-hide"),
			);
		}

		var toc = document.getElementById("fw-toc");
		var tocCheckbox = document.getElementById("fw-toc-checkbox");
		var select = () => {};
		if (toc) {
			const tabs = element("div", "book-flap-tabs", { role: "tablist" });
			const pins = toc.querySelectorAll(".fw-pin-show");
			select = (name) => {
				toc.classList.toggle("book-flap-tab-flap", name === "flap");
				// The skin's button puts back what the drawer shows.
				pins.forEach((pin) => {
					pin.setAttribute("data-fw-pin", name === "flap" ? "aside" : "toc");
				});
				Array.prototype.forEach.call(tabs.children, (tab) => {
					const selected = tab.getAttribute("data-tab") === name;
					tab.classList.toggle("book-flap-tab-selected", selected);
					tab.setAttribute("aria-selected", String(selected));
				});
			};
			[
				["toc", "toc"],
				["flap", "navigation"],
			].forEach((tab) => {
				const button = element("button", "book-flap-tab", {
					type: "button",
					role: "tab",
					"data-tab": tab[0],
				});
				button.textContent = mw.msg(tab[1]);
				button.addEventListener("click", () => {
					select(tab[0]);
				});
				tabs.append(button);
			});
			toc.classList.add("book-flap-has-tabs");
			const tocHeader = toc.querySelector(".fw-toc-header");
			if (tocHeader) tocHeader.prepend(tabs);
			select("toc");
			// The ToC button opens the ToC, and the strip below opens 책날개.
			const tocToggle = document.getElementById("fw-toc-toggle");
			if (tocToggle) {
				tocToggle.addEventListener("click", () => {
					select("toc");
				});
			}
		}

		// A drawer of its own, built like the skin's ToC drawer
		var close = element("button", "fw-toc-close fw-button", {
			type: "button",
			title: mw.msg("ooui-popup-widget-close-button-aria-label"),
			"aria-label": mw.msg("ooui-popup-widget-close-button-aria-label"),
		});
		var heading = element("h2", "fw-toc-heading", { id: "book-flap-heading" });
		heading.textContent = mw.msg("navigation");
		var header = element("div", "fw-toc-header");
		header.append(
			heading,
			pinButton("fw-pin-show", "1", "skin-femiwiki-pin-show"),
			close,
		);
		var panel = element("div", "fw-toc-panel");
		panel.append(header);
		var drawer = element("nav", "book-flap-drawer skin-fw-unprintable", {
			id: "book-flap-drawer",
			"aria-labelledby": "book-flap-heading",
		});
		drawer.append(
			element("div", "fw-toc-backdrop", { "aria-hidden": "true" }),
			panel,
		);
		var page = document.querySelector(".fw-page");
		if (page) page.append(drawer);
		var strip;

		function setDrawerOpen(open) {
			drawer.classList.toggle("book-flap-drawer-open", open);
			if (strip) strip.setAttribute("aria-expanded", String(open));
			if (open) close.focus();
		}
		drawer.addEventListener("click", (event) => {
			const target = event.target instanceof Element ? event.target : null;
			if (target && target.closest(".fw-toc-backdrop, .fw-toc-close")) {
				setDrawerOpen(false);
				if (strip) strip.focus();
			}
			// A pick from the list leaves the drawer, as the ToC's does.
			if (target && target.closest("a")) {
				setDrawerOpen(false);
			}
		});
		drawer.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				setDrawerOpen(false);
				if (strip) strip.focus();
			}
		});

		// Where 책날개 is in a drawer, a strip under the title names it and
		// opens the drawer on it, so readers see it is there (#333).
		var inToc = false;
		var stripLabel = element("span", "book-flap-strip-label");
		stripLabel.textContent = mw.msg("navigation");
		var stripTitles = element("span", "book-flap-strip-titles");
		stripTitles.textContent = Array.prototype.map
			.call(raws, (raw) =>
				Array.prototype.map
					.call(
						raw.querySelectorAll(".book-flap-title"),
						(title) => title.textContent,
					)
					.join("")
					.trim(),
			)
			.filter(Boolean)
			.join(" · ");
		strip = element("button", "book-flap-strip skin-fw-unprintable", {
			type: "button",
			"aria-expanded": "false",
		});
		strip.append(stripLabel, stripTitles);
		strip.addEventListener("click", () => {
			if (!inToc) {
				setDrawerOpen(true);
				return;
			}
			select("flap");
			if (!tocCheckbox) return;
			tocCheckbox.checked = true;
			// The skin's checkbox hack updates aria-expanded on this event.
			tocCheckbox.dispatchEvent(new Event("input", { bubbles: true }));
		});
		var pageHeader = document.getElementById("p-header");
		if (pageHeader) pageHeader.append(strip);

		var classList = document.documentElement.classList;
		var desktop = window.matchMedia("(min-width: 1120px)");
		var scheduled = false;
		function layout() {
			scheduled = false;
			var wide = desktop.matches && !body.classList.contains("fw-wide-content");
			// The skin's ToC is a column there, unless the reader folded it away.
			var tocColumn =
				wide && !!toc && !classList.contains("fw-toc-pinned-clientpref-0");
			// Kept beside the content unless the reader folded it away. Before the
			// skin has the preference, the class is missing and it stays.
			var pinned = !classList.contains("fw-aside-pinned-clientpref-0");
			// The right column takes 책날개 once it is wide enough for it.
			var style = page && window.getComputedStyle(page);
			var width =
				style && style.display === "grid"
					? parseFloat(style.gridTemplateColumns.split(" ")[2]) || 0
					: 0;
			var rem = parseFloat(
				window.getComputedStyle(document.documentElement).fontSize,
			);
			var asideMode = wide && pinned && width >= 14 * rem;
			inToc = !asideMode && !!toc && !tocColumn;
			body.classList.toggle("book-flap-aside-mode", asideMode);
			body.classList.toggle("book-flap-in-toc", inToc);
			body.classList.toggle("book-flap-in-drawer", !asideMode && !inToc);
			const paneParent = inToc ? toc.querySelector(".fw-toc-panel") : panel;
			if (paneParent) paneParent.append(pane);
			if (asideMode || inToc) setDrawerOpen(false);
			if (
				asideMode &&
				tocCheckbox &&
				tocCheckbox.checked &&
				toc &&
				toc.classList.contains("book-flap-tab-flap")
			) {
				tocCheckbox.checked = false;
				tocCheckbox.dispatchEvent(new Event("input", { bubbles: true }));
			}
			if (!inToc) select("toc");
		}
		function schedule() {
			if (!scheduled) {
				scheduled = true;
				window.requestAnimationFrame(layout);
			}
		}
		window.addEventListener("resize", schedule);
		mw.hook("skins.femiwiki.pinned").add(schedule);
		layout();
	}
})();
// </nowiki>
