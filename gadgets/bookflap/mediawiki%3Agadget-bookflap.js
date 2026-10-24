/**
 * [[틀:책날개]]를 보조합니다.
 */
// <nowiki>
(() => {
	var $raws = $(".book-flap-raw");
	if (
		mw.config.get("skin") !== "femiwiki" ||
		$raws.length === 0 ||
		mw.config.get("wgPageContentModel") === "flow-board"
	)
		return;

	// FemiwikiSkin 6 draws the ToC outside the content and leaves a right column
	// (FemiwikiSkin#348), so 책날개 goes there instead of buttons in the content.
	if (!document.getElementById("fw-page-aside")) return;
	outsideContent();

	function makeCollapsible($root) {
		var $li = $root.find(".book-flap-body > ul > li");
		$li.each(function () {
			var $hidable = $(this).children("ul");
			if ($hidable.length === 0) return;

			$("<div>")
				.addClass("bookflap-collapse-button")
				.html("▼")
				.prependTo($(this))
				.click(() => {
					$hidable.toggle();
				});

			if ($(this).find(".mw-selflink").length === 0) $hidable.hide();
		});
	}

	/**
	 * Wide screens show 책날개 in the right column, unless the reader folded it
	 * away (FemiwikiSkin's fw-aside-pinned client preference). Elsewhere it is a
	 * "둘러보기" tab in the ToC drawer, or a drawer of its own where the ToC is a
	 * column or there is no ToC.
	 */
	function outsideContent() {
		var $body = $("body").addClass("book-flap-outside");
		var $aside = $("<div></div>")
			.addClass("book-flap-aside skin-fw-unprintable")
			.appendTo($("#fw-page-aside"));
		var $pane = $("<div></div>").addClass("book-flap-pane");

		$raws.each(function () {
			var $raw = $(this);
			$.each([$aside, $pane], (_, $target) => {
				var $flap = $("<div></div>")
					.addClass("book-flap-side")
					.append(
						$("<div></div>")
							.addClass("book-flap-title")
							.append(
								$raw
									.find(".book-flap-title a, .book-flap-title .mw-selflink")
									.clone(),
							),
						$raw.find(".book-flap-body").clone().addClass("mw-parser-output"),
					)
					.appendTo($target);
				if ($raw.hasClass("book-flap-collapsible")) makeCollapsible($flap);
			});
		});

		// The skin saves the choice on a click on these (FemiwikiSkin pinning.js).
		function pinButton(className, value, msg) {
			return $("<button></button>")
				.attr({
					type: "button",
					"data-fw-pin": "aside",
					"data-fw-pin-value": value,
					title: mw.msg(msg),
					"aria-label": mw.msg(msg),
				})
				.addClass("fw-pin-button " + className);
		}
		$aside
			.find(".book-flap-title")
			.first()
			.append(pinButton("fw-pin-hide-end", "0", "skin-femiwiki-pin-hide"));

		var $toc = $("#fw-toc");
		var tocCheckbox = document.getElementById("fw-toc-checkbox");
		var select = () => {};
		if ($toc.length) {
			const $tabs = $("<div></div>")
				.addClass("book-flap-tabs")
				.attr("role", "tablist");
			const $pin = $toc.find(".fw-pin-show");
			select = (name) => {
				$toc.toggleClass("book-flap-tab-flap", name === "flap");
				// The skin's button puts back what the drawer shows.
				$pin.attr("data-fw-pin", name === "flap" ? "aside" : "toc");
				$tabs.children().each(function () {
					var selected = $(this).attr("data-tab") === name;
					$(this)
						.toggleClass("book-flap-tab-selected", selected)
						.attr("aria-selected", String(selected));
				});
			};
			$.each(
				[
					["toc", "toc"],
					["flap", "navigation"],
				],
				(_, tab) => {
					$("<button></button>")
						.attr({ type: "button", role: "tab", "data-tab": tab[0] })
						.addClass("book-flap-tab")
						.text(mw.msg(tab[1]))
						.on("click", () => {
							select(tab[0]);
						})
						.appendTo($tabs);
				},
			);
			$toc.addClass("book-flap-has-tabs").find(".fw-toc-header").prepend($tabs);
			select("toc");
			// The ToC button opens the ToC, and the strip below opens 책날개.
			$("#fw-toc-toggle").on("click", () => {
				select("toc");
			});
		}

		// A drawer of its own, built like the skin's ToC drawer
		var $close = $("<button></button>")
			.attr({
				type: "button",
				title: mw.msg("ooui-popup-widget-close-button-aria-label"),
				"aria-label": mw.msg("ooui-popup-widget-close-button-aria-label"),
			})
			.addClass("fw-toc-close fw-button");
		var $drawer = $("<nav></nav>")
			.attr({ id: "book-flap-drawer", "aria-labelledby": "book-flap-heading" })
			.addClass("book-flap-drawer skin-fw-unprintable")
			.append(
				$("<div></div>")
					.addClass("fw-toc-backdrop")
					.attr("aria-hidden", "true"),
				$("<div></div>")
					.addClass("fw-toc-panel")
					.append(
						$("<div></div>")
							.addClass("fw-toc-header")
							.append(
								$("<h2></h2>")
									.attr("id", "book-flap-heading")
									.addClass("fw-toc-heading")
									.text(mw.msg("navigation")),
								pinButton("fw-pin-show", "1", "skin-femiwiki-pin-show"),
								$close,
							),
					),
			)
			.appendTo($(".fw-page"));
		var $strip;

		function setDrawerOpen(open) {
			$drawer.toggleClass("book-flap-drawer-open", open);
			if ($strip) $strip.attr("aria-expanded", String(open));
			if (open) $close.trigger("focus");
		}
		$drawer.on("click", ".fw-toc-backdrop, .fw-toc-close", () => {
			setDrawerOpen(false);
			if ($strip) $strip.trigger("focus");
		});
		$drawer.on("keydown", (event) => {
			if (event.key === "Escape") {
				setDrawerOpen(false);
				if ($strip) $strip.trigger("focus");
			}
		});
		// A pick from the list leaves the drawer, as the ToC's does.
		$drawer.on("click", "a", () => {
			setDrawerOpen(false);
		});

		// Where 책날개 is in a drawer, a strip under the title names it and
		// opens the drawer on it, so readers see it is there (#333).
		var inToc = false;
		$strip = $("<button></button>")
			.attr({ type: "button", "aria-expanded": "false" })
			.addClass("book-flap-strip skin-fw-unprintable")
			.append(
				$("<span></span>")
					.addClass("book-flap-strip-label")
					.text(mw.msg("navigation")),
				$("<span></span>")
					.addClass("book-flap-strip-titles")
					.text(
						$raws
							.map(function () {
								return $(this).find(".book-flap-title").text().trim();
							})
							.get()
							.filter(Boolean)
							.join(" · "),
					),
			)
			.on("click", () => {
				if (!inToc) {
					setDrawerOpen(true);
					return;
				}
				select("flap");
				if (!tocCheckbox) return;
				tocCheckbox.checked = true;
				// The skin's checkbox hack updates aria-expanded on this event.
				tocCheckbox.dispatchEvent(new Event("input", { bubbles: true }));
			})
			.appendTo($("#p-header"));

		var classList = document.documentElement.classList;
		var desktop = window.matchMedia("(min-width: 1120px)");
		var page = document.querySelector(".fw-page");
		var scheduled = false;
		function layout() {
			scheduled = false;
			var wide = desktop.matches && !$body.hasClass("fw-wide-content");
			// The skin's ToC is a column there, unless the reader folded it away.
			var tocColumn =
				wide &&
				$toc.length > 0 &&
				!classList.contains("fw-toc-pinned-clientpref-0");
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
			inToc = !asideMode && $toc.length > 0 && !tocColumn;
			$body
				.toggleClass("book-flap-aside-mode", asideMode)
				.toggleClass("book-flap-in-toc", inToc)
				.toggleClass("book-flap-in-drawer", !asideMode && !inToc);
			$pane.appendTo(
				inToc ? $toc.find(".fw-toc-panel") : $drawer.find(".fw-toc-panel"),
			);
			if (asideMode || inToc) setDrawerOpen(false);
			if (
				asideMode &&
				tocCheckbox &&
				tocCheckbox.checked &&
				$toc.hasClass("book-flap-tab-flap")
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
		$(window).on("resize", schedule);
		mw.hook("skins.femiwiki.pinned").add(schedule);
		layout();
	}
})();
// </nowiki>
