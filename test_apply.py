from apply import file_to_title, sanitize_args, validate_files


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
