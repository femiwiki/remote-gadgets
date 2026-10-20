#!/usr/bin/python

import logging
import subprocess
from math import log
from ntpath import basename
from os import environ, path
from pathlib import Path
from re import search
from sys import argv, exit, stdout
from time import sleep
from urllib.parse import unquote

import mwclient

logging.basicConfig(stream=stdout, level=logging.DEBUG)
logger = logging.getLogger(__name__)

TARGET_DIRECTORIES = ["pages", "gadgets", "lua"]

USERNAME = "페미위키_깃헙_가젯_봇"
TOKEN_ID = "페미위키_깃헙_가젯_봇"


def sanitize_args(arr):
    if len(arr) == 2 and arr[1] == "help":
        print(f"Usage:  {arr[0]}")
        exit()
    elif len(arr) > 1:
        exit(1)


def get_modified_files(wiki):
    """return (changed, moved) since the previously applied commit, or None
    if that commit does not exist"""
    latest_commit = environ["GITHUB_SHA"]

    result = wiki.api(
        "query",
        list="usercontribs",
        uclimit=1,
        ucprop="comment",
        ucuser=USERNAME,
    )

    contribs = result["query"]["usercontribs"]
    if not contribs:
        return None

    previous_commit = search(r"/commit/(.+)$", contribs[0]["comment"])
    if not previous_commit:
        return None

    previous_commit = previous_commit.group(1)

    GIT_COMMAND = [
        "git",
        "diff-tree",
        "--no-commit-id",
        "--name-status",
        "-M",
        "-z",
        "-r",
        previous_commit,
        latest_commit,
    ]

    logger.info(f"git command: {GIT_COMMAND}")

    result = subprocess.run(
        GIT_COMMAND, capture_output=True, check=True, text=True
    )

    return parse_name_status(result.stdout)


def parse_name_status(output):
    """split `git diff-tree --name-status -M -z` output into the changed
    files and the (old, new) pairs of renamed files"""
    fields = output.split("\0")
    changed = []
    moved = []
    i = 0
    while i + 1 < len(fields):
        status = fields[i]
        if status.startswith("R"):
            moved.append((fields[i + 1], fields[i + 2]))
            i += 3
        else:
            changed.append(fields[i + 1])
            i += 2
    return changed, moved


def split_moves(changed, moved):
    """return the files to save and the renames that move a wiki page.

    A renamed file is saved after its page moves, as the rename may have
    changed its content too. A rename into or out of the target
    directories, or one that keeps the page title, stays a plain change."""
    changed = list(changed)
    moves = []
    for old, new in moved:
        if validate_files([old, new]) != [old, new]:
            changed += [old, new]
            continue
        if normalize_title(file_to_title(old)) != normalize_title(
            file_to_title(new)
        ):
            moves.append((old, new))
        changed.append(new)
    return validate_files(changed), moves


def validate_files(arr):
    def is_target(f):
        for d in TARGET_DIRECTORIES:
            if f.startswith(d):
                return True
        return False

    return [f for f in arr if is_target(f)]


def file_to_title(file):
    if search(r"^lua/.+/.+", file):
        # Lua modules fetched by Legunto
        _, prefix, title = file.split("/")
        title = unquote(title)
        return f"module:@{prefix}/{title}"
    elif file.startswith("lua/"):
        # Lua modules
        return "module:" + unquote(basename(file))
    elif "mediawiki%3Agadgets%2F" in file:
        return "mediawiki:gadgets/" + basename(unquote(file))
    else:
        # Unquote after basename() so a subpage's %2F stays in the title
        return unquote(basename(file))


def normalize_title(title):
    """compare titles as MediaWiki does: `_` is a space, runs of spaces
    collapse, and the namespace and the first letter are case-insensitive"""
    title = " ".join(title.replace("_", " ").split())
    namespace, colon, name = title.partition(":")
    if colon and namespace.strip().lower() in ("mediawiki", "module"):
        namespace = namespace.strip().lower() + ":"
        name = name.strip()
    else:
        namespace = ""
        name = title
    return namespace + name[:1].upper() + name[1:]


def find_duplicate_titles(files):
    """return {title: [files]} for every page more than one file maps to"""
    titles = {}
    for f in files:
        titles.setdefault(normalize_title(file_to_title(f)), []).append(f)
    return {t: fs for t, fs in titles.items() if len(fs) > 1}


def make_summary():
    return (
        "Github @"
        + environ["GITHUB_ACTOR"]
        + "의 "
        + "https://github.com/"
        + environ["GITHUB_REPOSITORY"]
        + "/commit/"
        + environ["GITHUB_SHA"][:8]
    )


def move_pages_on_wiki(moves, wiki):
    """move each page to its new title, leaving a redirect behind, so its
    history follows the renamed file"""
    SUMMARY = make_summary()

    for old, new in moves:
        old_title = file_to_title(old)
        new_title = file_to_title(new)
        page = wiki.pages[old_title]
        if not page.exists:
            logger.info(f"Not moving {old_title}: it does not exist")
            continue
        if wiki.pages[new_title].exists:
            logger.warning(
                f"Not moving {old_title}: {new_title} already exists"
            )
            continue
        try:
            logger.debug(f"Moving: {old_title} to {new_title}...")
            page.move(new_title, SUMMARY)
            logger.debug(f"Moved: {old_title} to {new_title}")
        except (
            mwclient.errors.APIError,
            mwclient.errors.InsufficientPermission,
        ) as e:
            logger.warning(f"Failed to move {old_title}: {e}")


def edit_pages_on_wiki(targets, wiki):
    logger.info("target files:" + " / ".join(targets))

    SUMMARY = make_summary()

    for i, FILE in enumerate(targets):
        title = file_to_title(FILE)
        page = wiki.pages[title]
        try:
            with open(FILE, "r") as f:
                logger.debug("Saving: " + title + "...")
                page.save(f.read(), SUMMARY)
                logger.debug("Saved: " + title)
        except FileNotFoundError:
            logger.debug("Deleting: " + title + "...")
            try:
                # Danger task
                # page.delete(SUMMARY)
                # logger.debug('Deleted: '+title)
                logger.debug("Deleting is skipped: " + title)
            except mwclient.errors.APIError as e:
                logger.info("APIError: " + str(e.info))

        time_to_sleep = log(i + 1)
        logger.debug("Sleep " + str(time_to_sleep) + " seconds...")
        sleep(time_to_sleep)


def get_all_files():
    ROOT = Path(".")
    glob = [p for d in TARGET_DIRECTORIES for p in ROOT.glob(f"{d}/**/*")]
    return sorted(str(p) for p in glob if path.isfile(p))


def main():
    sanitize_args(argv)

    duplicates = find_duplicate_titles(get_all_files())
    for title, files in duplicates.items():
        logger.error(f"{title} is mapped from more than one file: {files}")
    if duplicates:
        exit(1)

    FEMIWIKI = mwclient.Site("femiwiki.com", path="/")

    PASSWORD = environ["FEMIWIKI_BOT_PASSWORD"]
    FEMIWIKI.login(f"{USERNAME}@{TOKEN_ID}", PASSWORD)

    try:
        modified = get_modified_files(FEMIWIKI)
    except subprocess.SubprocessError:
        logger.info("Failed to load the last applied commit")
        modified = None

    if modified is None:
        logger.info("Trying to apply all files...")
        CHANGED, MOVES = get_all_files(), []
    else:
        CHANGED, MOVES = split_moves(*modified)

    # Move first, so the new title is free when the new file is saved
    move_pages_on_wiki(MOVES, FEMIWIKI)
    edit_pages_on_wiki(CHANGED, FEMIWIKI)


if __name__ == "__main__":
    main()
