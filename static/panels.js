'use strict';


function ForEachInClass(c, func) {
  var items = document.getElementsByClassName(c);
  for (var i = 0; i < items.length; i++) {
    func(items[i]);
  }
}

var last_scroll = 0;
var last_entry = null;

function OpenEdit(entry) {
  var content = entry.content.split('\n');
  content.shift();  // drop modified
  var image = content.shift().replace('\r', '');
  return Promise.resolve().then(function() {
    if (image === 'noimage') {
      surface.clear([0, 0, 0, 0]);
    } else {
      return surface.import(document.getElementById('backcanvas'), image);
    }
  }).then(function() {
    last_entry = entry;
    last_scroll = window.scrollY;
    ForEachInClass('viewing', function(i) { i.style.display = 'none'; });
    ForEachInClass('editing', function(i) { i.style.display = ''; });
    if (image !== 'noimage') {
      document.getElementById('paint_area').style.display = '';
      SelectBrush(0);
    }
    var edit_area = document.getElementById('edit_area');
    edit_area.value = content.join('\n');
    window.scrollTo(0, 0);
    edit_area.focus();
  });
}

function CloseEdit() {
  SelectBrush(-1);
  ForEachInClass('editing', function(i) { i.style.display = 'none'; });
  ForEachInClass('viewing', function(i) { i.style.display = ''; });
  document.getElementById('paint_area').style.display = 'none';
  window.scrollTo(0, last_scroll);
}

function ForEachBrush(func) {
  for (var j = 0; j < 3; j++) {
    for (var i = 0; i < 6; i++) {
      var b = document.getElementById('brush' + j + '' + i);
      func(i + j * 6, b);
    }
  }
}

function SelectBrush(pick) {
  ForEachBrush(function(i, b) {
    if (pick === i) {
      b.style.backgroundColor = '#fc0';
    } else {
      b.style.backgroundColor = '';
    }
  });
  brush = pick;
}

function InitPanels() {
  var query = document.getElementById('query');
  query.onkeypress = function(e) {
    if (e.which === 13) {
      query.blur();
    }
  };
  query.onblur = function(e) {
    query.select();
  };

  var entries = document.getElementById('entries');
  entries.style.display = '';

  var paint_area = document.getElementById('paint_area');
  paint_area.style.display = 'none';
  var cancel = document.getElementById('cancel');
  CloseEdit(); 

  var iambic = document.getElementById('iambic');
  var canvas = document.getElementById('canvas');

  ForEachBrush(function(i, b) {
    b.onmousedown = function(e) {
      paint_area.style.display = '';
      edit.blur();
      SelectBrush(i);
    };
  });

  iambic.onmousedown = function(e) {
    if (entries.style.display === '') {
      var dt = new Date();
      OpenEdit({
        content:
          '0\n' +
          'noimage\n' +
          '~ "' + dt.toString() + '"\n' +
          '~   "' + dt.toISOString() + '" create-stamp\n' +
          '~ ' + geoPosition.join(' ') + ' location-stamp\n\n',
        committed: 0,
        pending: 1,
      });
    } else {
      var edit_area = document.getElementById('edit_area');
      var image = 'noimage\n';
      if (paint_area.style.display === '') {
        image = surface.export(document.getElementById('backcanvas')) + '\n';
      }
      last_entry.modified = new Date();
      last_entry.content = last_entry.modified.getTime() + '\n' +
        image + edit_area.value;
      if (last_entry.created === undefined) {
        last_entry.created = last_entry.modified;
      }
      CloseEdit();
      last_entry.pending = 1;
      WriteEntry(last_entry).then(function() {
        console.log('wrote entry');
      });
    }
  };

  cancel.onmousedown = function(e) {
    CloseEdit();
  };
};
