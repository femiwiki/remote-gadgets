from apply import (
    file_to_title,
    find_duplicate_titles,
    get_all_files,
    normalize_title,
    sanitize_args,
    validate_files,
)


def test_sanitize_args(capsys):
    sanitize_args(["apply.py"])
    captured = capsys.readouterr()
    assert captured.out == ""


def test_validate_files():
    f = validate_files(
        [
            ".gitignore",
            "gadgets/foo/foo.js",
            "gadgets/foo/foo.css",
            "pages/mediawiki:common.css",
        ]
    )

    assert f == [
        "gadgets/foo/foo.js",
        "gadgets/foo/foo.css",
        "pages/mediawiki:common.css",
    ]


def test_file_to_title():
    assert (
        file_to_title("lua/ko/Citation%2FCS1%2FDate_validation")
        == "module:@ko/Citation/CS1/Date_validation"
    )
    assert file_to_title("lua/Wd%2Fi18n") == "module:Wd/i18n"
    assert (
        file_to_title("gadgets/mute/mediawiki%3Agadgets%2Fmute.json")
        == "mediawiki:gadgets/mute.json"
    )
    assert (
        file_to_title("gadgets/mute/mediawiki%3Agadget-mute.js")
        == "mediawiki:gadget-mute.js"
    )
    assert (
        file_to_title("pages/mediawiki%3Acommon.css") == "mediawiki:common.css"
    )


def test_get_all_files_is_sorted(tmp_path, monkeypatch):
    for f in ["pages/b", "pages/a", "lua/ko/b", "lua/ko/a", "gadgets/x/a"]:
        (tmp_path / f).parent.mkdir(parents=True, exist_ok=True)
        (tmp_path / f).touch()
    (tmp_path / "other").touch()
    monkeypatch.chdir(tmp_path)

    assert get_all_files() == [
        "gadgets/x/a",
        "lua/ko/a",
        "lua/ko/b",
        "pages/a",
        "pages/b",
    ]


def test_normalize_title():
    assert normalize_title("module:@ko/Date_validation") == normalize_title(
        "module:@ko/Date validation"
    )
    assert normalize_title("module:Wd") == normalize_title("Module:wd")
    assert normalize_title("mediawiki:common.css") == normalize_title(
        "MediaWiki:Common.css"
    )
    assert normalize_title("module:A  b ") == normalize_title("module: A b")
    assert normalize_title("module:Wd") != normalize_title("module:WD")


def test_find_duplicate_titles():
    space = "lua/ko/Citation%2FCS1%2FDate%20validation"
    underscore = "lua/ko/Citation%2FCS1%2FDate_validation"
    sandbox = "lua/ko/Citation%2FCS1%2FDate_validation%2Fsandbox"

    assert find_duplicate_titles([underscore, sandbox]) == {}
    assert find_duplicate_titles([space, underscore, sandbox]) == {
        "module:@ko/Citation/CS1/Date validation": [space, underscore]
    }
