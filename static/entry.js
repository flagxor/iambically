'use strict';


function ExpandEntry(entry) {
  var content = entry.content.split('\n');
  entry.modified = new Date(parseInt(content[0], 10));
}
