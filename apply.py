import mwclient
from os import environ
from sys import argv, stdout
from time import sleep
from math import log
import logging
logging.basicConfig(stream=stdout, level=logging.DEBUG)

PASSWORD = environ['FEMIWIKI_BOT_PASSWORD']

TARGET_PATH = 'pages/'
MODIFIED = [f for f in argv[1:] if f.startswith(TARGET_PATH)]


def main():
    if not MODIFIED:
        logging.info('There is no modified file')
        return

    logging.info('modified files:' + ' / '.join(MODIFIED))

    FEMIWIKI = mwclient.Site('femiwiki.com', path='/')
    FEMIWIKI.login('페미위키_깃헙_가젯_봇@페미위키_깃헙_가젯_봇', PASSWORD)

    SUMMARY = "Github @" + environ['GITHUB_ACTOR'] + "의 " + "https://github.com/" + \
        environ['GITHUB_REPOSITORY'] + "/commit/" + environ['GITHUB_SHA'][:7]

    for i, FILE in enumerate(MODIFIED):
        title = FILE[len(TARGET_PATH):]
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


if __name__ == '__main__':
    main()
