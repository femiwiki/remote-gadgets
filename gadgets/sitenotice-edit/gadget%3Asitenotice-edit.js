// <nowiki>
(function () {
  var editButton = document.createElement('a');
  editButton.href = '/index.php?title=MediaWiki:Sitenotice&veaction=edit';

  editButton.style.width = '1em';
  editButton.style.height = '1em';
  editButton.style.display = 'block';
  editButton.style.backgroundSize = '100%';
  editButton.style.backgroundImage =
    "url('https://femiwiki-uploaded-files-thumb.s3.amazonaws.com/8/82/OOjs_UI_icon_edit-ltr-colored.svg/10px-OOjs_UI_icon_edit-ltr-colored.svg.png')";

  var sitenotice = document.querySelector('#localNotice');
  var header = document.querySelector('.fw-header');
  if (sitenotice) {
    editButton.style.float = 'right';
    sitenotice.insertBefore(editButton, sitenotice.firstChild);
  } else {
    editButton.style.float = 'auto';
    editButton.style.margin = 'auto';
    editButton.style.marginTop = '1em';
    document.body.insertBefore(editButton, header);
  }
})();
// </nowiki>
