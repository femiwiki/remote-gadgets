// <nowiki>
(function () {
  var editButton = document.createElement('a');
  editButton.href = '/index.php?title=MediaWiki:Sitenotice&veaction=edit';

  editButton.classList.add('sitenotice-edit-button');

  var sitenotice = document.querySelector('#localNotice');
  var header = document.querySelector('.fw-header');
  if (sitenotice) {
    sitenotice.insertBefore(editButton, sitenotice.firstChild);
  } else {
    document.body.insertBefore(editButton, header);
  }
})();
// </nowiki>
