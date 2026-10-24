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
			const notice = document.createElement("p");
			notice.textContent =
				"키워드는 페미위키 서버가 아닌 사용자 브라우저에 저장됩니다." +
				" 여러 브라우저로 페미위키를 이용하시는 분들은 각 브라우저별로" +
				" 키워드를 등록해주시기 바랍니다.";
			this.content.$element[0].append(this.input.$element[0], notice);
			this.$body[0].append(this.content.$element[0]);
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
			const content = this.content.$element[0];
			const style = window.getComputedStyle(content);
			return (
				content.offsetHeight +
				parseFloat(style.marginTop) +
				parseFloat(style.marginBottom)
			);
		};
	}

	function _openEditor() {
		mw.loader.using(["oojs-ui-core", "oojs-ui-windows"]).then(() => {
			if (!_windowManager) {
				_defineEditor();
				_windowManager = new OO.ui.WindowManager();
				document.body.append(_windowManager.$element[0]);
				_editor = new MuteEditor({ size: "medium" });
				_windowManager.addWindows([_editor]);
			}
			_windowManager.openWindow(_editor);
		});
	}

	function _initUI() {
		const link = mw.util.addPortletLink(
			"p-personal",
			"#",
			"뮤트",
			"p-mute",
			"금지어를 설정합니다.",
		);
		if (!link) return;
		link.addEventListener("click", (e) => {
			e.preventDefault();
			_openEditor();
		});
	}

	function _showTriggerWarning() {
		// Do nothing if it's edit mode
		if (document.body.classList.contains("action-edit")) return;
		if (document.documentElement.classList.contains("ve-activated")) return;

		const content = document.getElementById("content");
		if (!content || !shouldMute(content.innerHTML)) return;

		// Show trigger warning
		const contentText = document.getElementById("mw-content-text");
		if (!contentText) return;
		contentText.prepend(
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
	function _lineText(line) {
		return Array.prototype.map
			.call(
				line.querySelectorAll(
					".mw-title, .comment, .mw-changeslist-log-entry > a:not(.mw-userlink)",
				),
				(el) => el.textContent,
			)
			.join("\n");
	}

	function _collapseControl(run, tag) {
		var count = run.length;
		const button = document.createElement("button");
		button.type = "button";
		button.setAttribute("aria-expanded", "false");
		button.className = "cdx-button";
		button.textContent = `${count}개 가려짐`;
		button.addEventListener("click", () => {
			var expanded = button.getAttribute("aria-expanded") === "true";
			run.forEach((line) => {
				line.classList.toggle("fw-mute-hidden", expanded);
			});
			button.setAttribute("aria-expanded", String(!expanded));
			button.textContent = expanded ? `${count}개 가려짐` : "다시 가리기";
		});
		const control = document.createElement(tag);
		control.className = "fw-mute-collapsed";
		control.append(button);
		return control;
	}

	// The nearest sibling line before or after a line
	function _siblingLine(line, forward) {
		var sibling = forward
			? line.nextElementSibling
			: line.previousElementSibling;
		while (sibling && !sibling.matches(".mw-changeslist-line")) {
			sibling = forward
				? sibling.nextElementSibling
				: sibling.previousElementSibling;
		}
		return sibling;
	}

	function _hideMutedLines($content) {
		if (!_muteWords.length) return;
		// Legacy lines are <li>; enhanced lines are <table>, grouped or not
		const lines = [];
		Array.prototype.forEach.call($content, (root) => {
			root
				.querySelectorAll(
					"li.mw-changeslist-line:not(.fw-mute-checked), table.mw-changeslist-line:not(.fw-mute-checked)",
				)
				.forEach((line) => {
					line.classList.add("fw-mute-checked");
					lines.push(line);
				});
		});
		const muted = lines.filter((line) => shouldMute(_lineText(line)));
		if (!muted.length) return;

		mw.loader.load("codex-styles");
		muted.forEach((line) => {
			line.classList.add("fw-mute-hidden");
		});

		// Collapse each run of adjacent muted lines behind one button
		muted.forEach((first) => {
			if (muted.includes(_siblingLine(first, false))) return;
			var run = [first];
			var next = _siblingLine(first, true);
			while (muted.includes(next)) {
				run.push(next);
				next = _siblingLine(next, true);
			}
			// An enhanced line follows its expand checkbox
			var before = first.previousElementSibling;
			if (!before || !before.matches(".mw-enhancedchanges-checkbox")) {
				before = first;
			}
			before.before(_collapseControl(run, first.matches("li") ? "li" : "p"));
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
	function _init() {
		_initUI();
		if (!_isChangesListPage()) _showTriggerWarning();
	}
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", _init);
	} else {
		_init();
	}

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
