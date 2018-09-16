'use strict';


function InitSweep() {
  var forth = new PromiseForth();
  forth.loadUnescaped(CORE_WORDS);
  forth.set('query', document.getElementById('query').value);
  forth.set('alerts', []);
  forth.set('entries', []);
  return Promise.resolve().then(function() {
    if (window.location.search.search('debug') < 0) {
      return TimeListEntries(function(entry) {
        var content = entry.content.split('\n');
        content.shift();
        content.shift();
        forth.clearStack();
        forth.reset('__default__');
        forth.loadEscaped(content.join('\n'));
      });
    }
  }).then(function() {
    forth.clearStack();
    forth.reset('__default__');
    return forth.compilePrefix('start-')();
  }).then(function() {
    return TimeListEntries(function(entry) {
      var content = entry.content.split('\n');
      content.shift();
      content.shift();
      forth.set('entry', entry);
      forth.set('content', content.join('\n'));
      forth.set('created', new Date(0));
      forth.set('latitude', 0);
      forth.set('longitude', 0);
      forth.clearStack();
      forth.reset('__default__');
      forth.loadDefaultOnly(forth.get('content'));
      return forth.compile('__default__')().then(function() {
        return forth.compilePrefix('each-')();
      });
    });
  }).then(function() {
    forth.clearStack();
    forth.reset('__default__');
    return forth.compilePrefix('finish-')();
  }).catch(function(error) {
    forth.get('alerts').push(
      'ERROR!!!\n' + error.toString() + '\nSTACK:\n' + error.stack);
  }).then(function() {
    var alerts = forth.get('alerts');
    var alerts_div = document.getElementById('alerts');
    ClearChildrenOver(alerts.length, alerts_div);
    for (var i = 0; i < alerts.length; i++) {
      SetChildEntry({
        content: '0\nnoimage\n' + alerts[i],
        modified: new Date(),
        isAlert: true,
      }, i, alerts_div);
    }
    var entries = forth.get('entries');
    if (entries.length === 0) {
      return TimeListEntries(function(entry) {
        entries.push(entry);
      }).then(function() {
        return entries;
      });
    }
    return entries;
  }).then(function(entries) {
    var entries_div = document.getElementById('entries');
    ClearChildrenOver(entries.length, entries_div);
    for (var i = 0; i < entries.length; i++) {
      SetChildEntry(entries[i], i, entries_div);
    }
  }).then(function() {
    if (document.getElementById('paint_area').style.display === '') {
      return sleep(20000);
    } else {
      return sleep(500);
    }
  }).then(function() {
    return InitSweep();
  });
}
