from apply import sanitize_args, validate_files


def test_sanitize_args(capsys):
    sanitize_args(['apply.py'])
    captured = capsys.readouterr()
    assert captured.out == ''

    sanitize_args(['apply.py', 'aaaaaaa'])
    captured = capsys.readouterr()
    assert captured.out == ''


def test_validate_files():
    f = validate_files([
        '.gitignore',
        'gadgets/foo/foo.js',
        'gadgets/foo/foo.css',
        'pages/mediawiki:common.css',
    ])

    assert f == [
        'gadgets/foo/foo.js',
        'gadgets/foo/foo.css',
        'pages/mediawiki:common.css',
    ]
