'use strict';


function ClearChildrenOver(num, dst) {
  var junk = [];
  var children = dst.childNodes;
  for (var i = num; i < children.length; i++) {
    junk.push(children[i]);
  }
  for (var i = 0; i < junk.length; i++) {
    dst.removeChild(junk[i]);
  }
}


function SetChildEntry(entry, i, dst) {
  var old = dst.childNodes[i];
  if (old !== undefined &&
      old.infoModified === entry.modified &&
      old.infoContent === entry.content) {
    return;
  }
  var content = entry.content.split('\n');
  content.shift();  // drop modified
  var article = document.createElement('div');
  article.className = 'entry';
  article.infoContent = entry.content;
  article.infoModified = entry.modified;
  if (entry['isAlert'] === true) {
    article.className += ' alert';
  }
  if (old === undefined) {
    dst.appendChild(article);
  } else {
    dst.replaceChild(article, old);
  }
  var stamp = document.createElement('div');
  stamp.innerText = entry.modified.toString();
  stamp.style.fontSize = '0.7em';
  stamp.style.fontStyle = 'italic;';
  stamp.style.textAlign = 'right';
  article.appendChild(stamp);
  var image = content.shift().replace('\r', '');
  if (image !== 'noimage') {
    var im = document.createElement('img');
    im.className = 'drawing';
    im.src = surface.unpackViewImage(image);
    article.appendChild(im);
  }
  var article_text = document.createElement('div');
  article_text.innerText = content.join('\n');
  article.appendChild(article_text);
  var buttons = document.createElement('div');
  buttons.style.width = '100%';
  article.appendChild(buttons);
  if (entry['isAlert'] !== true) {
    var button = document.createElement('img');
    button.src = '/static/favicon256.png';
    button.width = 32;
    button.height = 32;
    button.className = 'clickable';
    button.onmousedown = function(e) {
      OpenEdit(entry);
    };
    buttons.appendChild(button);
  }
}
