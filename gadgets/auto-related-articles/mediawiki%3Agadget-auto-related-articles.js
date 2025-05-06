// <nowiki>
(() => {
  const api = new mw.Api();
  api
    .get({
      action: 'query',
      titles: mw.config.get('wgPageName'),
      prop: 'linkshere|links',
      lhprop: 'title',
      lhshow: '!redirect',
      lhnamespace: 0,
      plnamespace: 0,
      format: 'json',
    })
    .done((data) => {
      if (!data) {
        return;
      }
      const page = Object.values(data.query.pages)[0];
      if (!page) {
        return;
      }
      const linkshere = page.linkshere
        ? page.linkshere.map((l) => l.title)
        : [];
      const links = page.links ? page.links.map((l) => l.title) : [];
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
