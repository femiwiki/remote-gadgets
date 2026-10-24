(() => {
	var _muteWords = loadData();
	var _windowManager;
	var _editor;

	function MuteEditor(config) {
		MuteEditor.super.call(this, config);
	}

	function _defineEditor() {
		OO.inheritClass(MuteEditor, OO.ui.ProcessDialog);
		MuteEditor.static.name = "muteEditor";
		MuteEditor.static.title = "뮤트";
		MuteEditor.static.actions = [
			{ action: "save", label: "저장", flags: ["primary", "progressive"] },
			{ label: "취소", flags: ["safe", "close"] },
		];

		MuteEditor.prototype.initialize = function (...args) {
			MuteEditor.super.prototype.initialize.apply(this, args);
			this.input = new OO.ui.MultilineTextInputWidget({
				placeholder: "감출 키워드를 한 줄에 하나씩 입력하세요.",
				rows: 8,
			});
			this.content = new OO.ui.PanelLayout({ padded: true, expanded: false });
			this.content.$element.append(
				this.input.$element,
				$("<p>").text(
					"키워드는 페미위키 서버가 아닌 사용자 브라우저에 저장됩니다." +
						" 여러 브라우저로 페미위키를 이용하시는 분들은 각 브라우저별로" +
						" 키워드를 등록해주시기 바랍니다.",
				),
			);
			this.$body.append(this.content.$element);
		};

		MuteEditor.prototype.getSetupProcess = function (data) {
			return MuteEditor.super.prototype.getSetupProcess
				.call(this, data)
				.next(function () {
					this.input.setValue(loadData().join("\n"));
				}, this);
		};

		MuteEditor.prototype.getReadyProcess = function (data) {
			return MuteEditor.super.prototype.getReadyProcess
				.call(this, data)
				.next(function () {
					this.input.focus();
				}, this);
		};

		MuteEditor.prototype.getActionProcess = function (action) {
			if (action === "save") {
				return new OO.ui.Process(function () {
					var muteWords = this.input.getValue().trim();
					if (saveData(muteWords ? muteWords.split("\n") : [])) {
						this.close({ action: action });
					}
				}, this);
			}
			return MuteEditor.super.prototype.getActionProcess.call(this, action);
		};

		MuteEditor.prototype.getBodyHeight = function () {
			return this.content.$element.outerHeight(true);
		};
	}

	function _openEditor() {
		mw.loader.using(["oojs-ui-core", "oojs-ui-windows"]).then(() => {
			if (!_windowManager) {
				_defineEditor();
				_windowManager = new OO.ui.WindowManager();
				$(document.body).append(_windowManager.$element);
				_editor = new MuteEditor({ size: "medium" });
				_windowManager.addWindows([_editor]);
			}
			_windowManager.openWindow(_editor);
		});
	}

	function _initUI() {
		$(
			mw.util.addPortletLink(
				"p-personal",
				"#",
				"뮤트",
				"p-mute",
				"금지어를 설정합니다.",
			),
		).on("click", (e) => {
			e.preventDefault();
			_openEditor();
		});
	}

	function _showTriggerWarning() {
		// Do nothing if it's edit mode
		if ($("body.action-edit").length) return;
		if ($("html.ve-activated").length) return;

		var text = $("#content").html();
		if (!shouldMute(text)) return;

		// Show trigger warning
		$("#mw-content-text").prepend(
			mw.util.messageBox(
				"가림 단어가 포함된 문서입니다. 이 문서의 제목 또는 본문에 한 개 이상의 가림 단어가 있습니다.",
				"warning",
			),
		);
	}

	// Changes lists: Special:RecentChanges, Special:Watchlist and the like
	var CHANGES_LIST_PAGES = [
		"Recentchanges",
		"Recentchangeslinked",
		"Watchlist",
	];

	function _isChangesListPage() {
		return CHANGES_LIST_PAGES.includes(
			mw.config.get("wgCanonicalSpecialPageName"),
		);
	}

	// The page titles and edit summaries of a line, or of a grouped line's
	// nested lines in the enhanced view
	function _lineText($line) {
		return $line
			.find(
				".mw-title, .comment, .mw-changeslist-log-entry > a:not(.mw-userlink)",
			)
			.map(function () {
				return this.textContent;
			})
			.get()
			.join("\n");
	}

	function _collapseControl($run, tag) {
		var count = $run.length;
		var $button = $("<button>")
			.attr({ type: "button", "aria-expanded": "false" })
			.addClass("cdx-button")
			.text(`${count}개 가려짐`)
			.on("click", () => {
				var expanded = $button.attr("aria-expanded") === "true";
				$run.toggleClass("fw-mute-hidden", expanded);
				$button
					.attr("aria-expanded", String(!expanded))
					.text(expanded ? `${count}개 가려짐` : "다시 가리기");
			});
		return $(`<${tag}>`).addClass("fw-mute-collapsed").append($button);
	}

	function _hideMutedLines($content) {
		if (!_muteWords.length) return;
		// Legacy lines are <li>; enhanced lines are <table>, grouped or not
		var $lines = $content
			.find("li.mw-changeslist-line, table.mw-changeslist-line")
			.not(".fw-mute-checked")
			.addClass("fw-mute-checked");
		var $muted = $lines.filter(function () {
			return shouldMute(_lineText($(this)));
		});
		if (!$muted.length) return;

		mw.loader.load("codex-styles");
		$muted.addClass("fw-mute-hidden");

		// Collapse each run of adjacent muted lines behind one button
		$muted.each(function () {
			var $first = $(this);
			if ($first.prevAll(".mw-changeslist-line").first().is($muted)) return;
			var run = [this];
			var $next = $first.nextAll(".mw-changeslist-line").first();
			while ($next.is($muted)) {
				run.push($next[0]);
				$next = $next.nextAll(".mw-changeslist-line").first();
			}
			var $run = $(run);
			// An enhanced line follows its expand checkbox
			var $before = $first.prev(".mw-enhancedchanges-checkbox");
			$($before[0] || this).before(
				_collapseControl($run, $first.is("li") ? "li" : "p"),
			);
		});
	}

	// Load, save
	function loadData() {
		return JSON.parse(localStorage.getItem("muteWords") || "[]");
	}

	function saveData(muteWords) {
		try {
			localStorage.setItem("muteWords", JSON.stringify(muteWords));
			_muteWords = muteWords;
			return true;
		} catch (_e) {
			mw.notify("프라이버시 모드에서는 이 기능을 사용하실 수 없습니다.", {
				type: "error",
			});
			return false;
		}
	}

	// Should mute or not?
	function shouldMute(text) {
		for (let i = 0; i < _muteWords.length; i++) {
			// A blank line in the editor would match everything
			if (_muteWords[i] && text.match(_muteWords[i])) return true;
		}
		return false;
	}

	// Init UI
	$(() => {
		_initUI();
		if (!_isChangesListPage()) _showTriggerWarning();
	});

	// The filters on these pages reload the list and fire this hook again
	if (_isChangesListPage()) {
		mw.hook("wikipage.content").add(_hideMutedLines);
	}

	// Expose public APIs
	var _FW = {};
	_FW.mute = {
		loadData: loadData,
		saveData: saveData,
		shouldMute: shouldMute,
	};
})();
