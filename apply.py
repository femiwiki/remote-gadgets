#!/usr/bin/python

from math import log
from ntpath import basename
from os import environ, popen, path
from pathlib import Path
from urllib.parse import unquote
from sys import argv, stdout, exit
from time import sleep
from re import search
import logging
import mwclient

logging.basicConfig(stream=stdout, level=logging.DEBUG)

TARGET_DIRECTORIES = [
    'pages',
    'gadgets',
    'lua'
]

USERNAME = '페미위키_깃헙_가젯_봇'
TOKEN_ID = '페미위키_깃헙_가젯_봇'


def sanitize_args(arr):
    if len(arr) == 2 and arr[1] == 'help':
        print(f'Usage:  {arr[0]}')
        exit()
    elif len(arr) > 1:
        exit(1)


def get_modified_files(wiki):
    '''return empty array if previous applied commit does not exist'''
    latest_commit = environ['GITHUB_SHA']

    result = wiki.api(
        'query',
        list='usercontribs',
        uclimit=1,
        ucprop='comment',
        ucuser=USERNAME,
    )

    contribs = result['query']['usercontribs']
    if not contribs:
        return None

    previous_commit = search(r'/commit/(.+)$', contribs[0]['comment'])
    if not previous_commit:
        return None

    previous_commit = previous_commit.group(1)

    GIT_COMMAND = 'git diff-tree --no-commit-id --name-only -r ' + \
        f'"{previous_commit}" "{latest_commit}"'

    logging.info('git command:' + GIT_COMMAND)

    return popen(GIT_COMMAND).read().split('\n')


def validate_files(arr):
    def is_target(f):
        for d in TARGET_DIRECTORIES:
            if f.startswith(d):
                return True
        return False

    return [f for f in arr if is_target(f)]


def edit_pages_on_wiki(targets, wiki):
    logging.info('target files:' + ' / '.join(targets))

    SUMMARY = "Github @" + environ['GITHUB_ACTOR'] + "의 " + \
        "https://github.com/" + environ['GITHUB_REPOSITORY'] + "/commit/" + \
        environ['GITHUB_SHA'][:8]

    for i, FILE in enumerate(targets):
        if search(r'^lua/.+/.+', FILE):
            # Lua modules fetched by Legunto
            _, prefix, title = FILE.split('/')
            title = unquote(title)
            title = f'module:@{prefix}/{title}'
        elif FILE.startswith('lua/'):
            # Lua modules
            title = 'module:'+unquote(basename(FILE))
        elif 'mediawiki%3Agadgets%2F' in FILE:
            title = 'mediawiki:gadgets/' + basename(unquote(FILE))
        else:
            title = basename(unquote(FILE))
        page = wiki.pages[title]
        try:
            f = open(FILE, "r")
            logging.debug('Saving: '+title+'...')
            page.save(f.read(), SUMMARY)
            logging.debug('Saved: '+title)
        except FileNotFoundError:
            logging.debug('Deleting: '+title+'...')
            try:
                # Danger task
                # page.delete(SUMMARY)
                # logging.debug('Deleted: '+title)
                logging.debug('Deleting is skipped: '+title)
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

    FEMIWIKI = mwclient.Site('femiwiki.com', path='/')

    PASSWORD = environ['FEMIWIKI_BOT_PASSWORD']
    FEMIWIKI.login(f'{USERNAME}@{TOKEN_ID}', PASSWORD)

    MODIFIED = validate_files(get_modified_files(FEMIWIKI))

    if MODIFIED:
        edit_pages_on_wiki(MODIFIED, FEMIWIKI)
    else:
        logging.info('Failed to load the last applied commit')
        logging.info('Trying to apply all files...')
        edit_pages_on_wiki(get_all_files(), FEMIWIKI)


if __name__ == '__main__':
    main()
