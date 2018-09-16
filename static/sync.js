'use strict';


var logged_in = false;
var online = false;
var backoff = 1;


var SYNC_ICON = {
  key: '&#x1f511;',
  now: '&#128257;',
  offline: '&#128257',
};


function UpdateSyncMode() {
  var sync = document.getElementById('sync');
  if (logged_in && online) {
    sync.innerHTML = SYNC_ICON.now;
  } else if (online) {
    sync.innerHTML = SYNC_ICON.key;
  } else {
    sync.innerHTML = SYNC_ICON.offline;
  }
  if (!logged_in || !online) {
    if (backoff < 64) {
      backoff *= 2;
    }
  } else {
    backoff = 1;
  }
}


function InitSync() {
  var sync = document.getElementById('sync');
  sync.onmousedown = function(e) {
    if (online && !logged_in) {
      window.open('/login');
    } else {
      sync_pending = true;
    }
  };
  UpdateSyncMode();
  function DoSync() {
    return Sync().then(function() {
      return sleep(1000 * backoff);
    }).then(function() {
      return DoSync();
    });
  }
  return DoSync();
}


function Sync() {
  return Promise.resolve().then(function() {
    if (!navigator.onLine) {
      online = false;
      logged_in = false;
      UpdateSyncMode();
      return;
    }
    if (!sync_pending) {
      return;
    }
    return HttpGet('/auth', {}).then(function(text) {
      if (text !== 'ok\n') {
        online = true;
        logged_in = false;
        UpdateSyncMode();
      } else {
        online = true;
        logged_in = true;
        UpdateSyncMode();
        return SyncReads().then(SyncWrites);
      }
    }, function(code) {
      if (code === 403 || code === 401) {
        online = true;
        logged_in = false;
      } else {
        online = false;
        logged_in = false;
      }
      UpdateSyncMode();
    });
  });
}


function SyncWrites() {
  return Promise.resolve().then(function() {
    FirstPendingEntry().then(function(entry) {
      if (!entry) {
        sync_pending = false;
        return;
      }
      return HttpPost('/commit', {
        content: entry.content,
        replaces: entry.server_key,
      }).then(function(result) {
        try {
          var row = result.split('\n')[0];
          var parts = row.split(' ');
          entry.pending = 0;
          entry.committed = parseInt(parts[0], 10);
          entry.server_key = parts[1];
          return WriteEntry(entry);
        } catch (e) {
        }
      }).catch(function(code) {
        if (code === 403) {
          logged_in = false;
          UpdateSyncMode();
        }
      });
    });
  });
}


function SyncReads() {
  return Promise.resolve().then(function() {
    return GetLastCommittedDate();
  }).then(function(last) {
    return HttpPost('/fetch', { start: '' + last });
  }).then(function(result) {
    try {
      var lines = result.split('\n');
      var count = parseInt(lines.shift(), 10);
      var i = 0;
      function loop() {
        return Promise.resolve().then(function() {
          if (i >= count) {
            return;
          }
          var parts = lines.shift().split(' ');
          var size = parseInt(parts[0], 10);
          var content = '';
          while (content.length < size) {
            var row = lines.shift() + '\n';
            var remaining = size - content.length;
            if (row.length > remaining) {
              content += row.substr(0, remaining);
              lines.unshift(row.substr(remaining));
            } else {
              content += row;
            }
          }
          var entry = {
            committed: parseInt(parts[1], 10),
            server_key: parts[2],
            content: content,
            pending: 0,
          };
          console.log('updating key: ' + parts[2] + ' at ' + parts[1]);
          i++;
          return WriteEntry(entry).then(loop);
        });
      }
      return loop();
    } catch (e) {
    }
  }).catch(function(code) {
    if (code === 403) {
      logged_in = false;
      UpdateSyncMode();
    }
  });
}
