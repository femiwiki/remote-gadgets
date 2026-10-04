// <nowiki>
(() => {
  const api = new mw.Api();
  const title = mw.config.get('wgPageName');
  api
    .get({
      action: 'query',
      formatversion: 2,
      // The pages this page links to, with a missing flag on the ones that do not exist
      generator: 'links',
      titles: title,
      gplnamespace: 0,
      list: 'backlinks',
      bltitle: title,
      blnamespace: 0,
      blfilterredir: 'nonredirects',
    })
    .done((data) => {
      if (!data || !data.query) {
        return;
      }
      const linkshere = data.query.backlinks
        ? data.query.backlinks.map((l) => l.title)
        : [];
      const links = data.query.pages
        ? data.query.pages.filter((p) => !p.missing).map((p) => p.title)
        : [];
      let allLinks = linkshere.concat(links);
      allLinks = allLinks.sort((a, b) => 0.5 - Math.random());
      // TODO: If the number of links is less than mw.config.get( 'wgRelatedArticlesCardLimit', 3 ),
      // Get random pages.
      const articles = {};
      for (const l of allLinks) {
        articles[l] = true;
      }
      mw.config.set('wgRelatedArticles', articles);
    });
})();
// </nowiki>
