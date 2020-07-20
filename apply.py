#!/usr/bin/python

from math import log
from ntpath import basename
from os import environ, popen, path
from pathlib import Path
from sys import argv, stdout, exit
from time import sleep
import logging
import mwclient

logging.basicConfig(stream=stdout, level=logging.DEBUG)

TARGET_DIRECTORIES = [
    'pages',
    'gadgets',
    'lua'
]


def sanitize_args(arr):
    if len(arr) == 2 and arr[1] == 'help':
        print(f'Usage:  {arr[0]} [previously applied commit id]')
        exit()
    elif len(arr) > 2:
        exit(1)


def modified_files_exists():
    return len(argv) == 1


def get_modified_files():
    '''return empty array if previous applied commit does not exist'''
    latest_commit = environ['GITHUB_SHA']

    if len(argv) < 2:
        return []

    previous_commit = argv[1]
    return popen(
        'git diff-tree --no-commit-id --name-only -r ' +
        f'"{previous_commit}" "{latest_commit}"'
    ).read().split('\n')


def validate_files(arr):
    def is_target(f):
        for d in TARGET_DIRECTORIES:
            if f.startswith(d):
                return True
        return False

    return [f for f in arr if is_target(f)]


def edit_pages_on_wiki(target):
    PASSWORD = environ['FEMIWIKI_BOT_PASSWORD']

    logging.info('target files:' + ' / '.join(target))

    FEMIWIKI = mwclient.Site('femiwiki.com', path='/')
    FEMIWIKI.login('페미위키_깃헙_가젯_봇@페미위키_깃헙_가젯_봇', PASSWORD)

    SUMMARY = "Github @" + environ['GITHUB_ACTOR'] + "의 " + \
        "https://github.com/" + environ['GITHUB_REPOSITORY'] + "/commit/" + \
        environ['GITHUB_SHA'][:7]

    for i, FILE in enumerate(target):
        title = basename(FILE)
        page = FEMIWIKI.pages[title]
        try:
            f = open(FILE, "r")
            logging.debug('Saving: '+title+'...')
            page.save(f.read(), SUMMARY)
            logging.debug('Saved: '+title)
        except FileNotFoundError:
            logging.debug('Deleting: '+title+'...')
            try:
                page.delete(SUMMARY)
                logging.debug('Deleted: '+title)
            except mwclient.errors.APIError as e:
                logging.info('APIError: '+str(e.info))

        time_to_sleep = log(i+1)
        logging.debug('Sleep '+str(time_to_sleep)+' seconds...')
        sleep(time_to_sleep)


def get_all_files():
    ROOT = Path('.')
    glob = sum([
        list(ROOT.glob(f'{d}/**/*'))
        for d in TARGET_DIRECTORIES
    ], [])
    return [
        str(p)
        for p
        in glob
        if path.isfile(p)
    ]


def main():
    sanitize_args(argv)

    MODIFIED = validate_files(get_modified_files())

    if MODIFIED:
        edit_pages_on_wiki(MODIFIED)
    else:
        logging.info('Failed to load the last applied commit')
        logging.info('Trying to apply all files...')
        edit_pages_on_wiki(get_all_files())


if __name__ == '__main__':
    main()
