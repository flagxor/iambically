'use strict';


var sync_pending = true;


function Promised(o) {
  return new Promise(function(resolve, reject) {
    o.onsuccess = function(event) {
      resolve(event.target.result);
    };
    o.oncomplete = function(event) {
      resolve();
    };
    o.onerror = function(event) {
      reject(event.target.error);
    };
    o.onabort = function(event) {
      reject(event.target.error);
    };
  });
}


function ForCursor(limit, request, func) {
  var count = 0;
  function loop(cursor) {
    if (cursor) {
      var result = func(cursor);
      count++;
      if (limit !== null && count >= limit) {
        return result;
      }
      cursor.continue();
      return Promise.resolve(function() {
        return result;
      }).then(function() {
        return Promised(request).then(loop);
      });
    }
  }
  return Promised(request).then(loop);
}


function RequestQuota() {
  var amount = 50 * 1024 * 1024;
  return new Promise(function(resolve, reject) {
    navigator.webkitPersistentStorage.requestQuota(
        amount, function(grantedBytes) {
      if (grantedBytes != amount) {
        console.log(
            'Quota, requested: ' + amount + ' granted: ' + grantedBytes);
      }
      resolve();
    });
  });
}


function OpenDatabase() {
  return RequestQuota().then(function() {
		var db_request = indexedDB.open('iambically', 1);
		db_request.onupgradeneeded = function(event) {
			var db = event.target.result;
			var entries = db.createObjectStore(
					'entries', { keyPath: 'key', autoIncrement: true });
			entries.createIndex('modified', 'modified', { unique: false });
			entries.createIndex('committed', 'committed', { unique: false });
			entries.createIndex('pending', 'pending', { unique: false });
			entries.createIndex('server_key', 'server_key', { unique: false });
			entries.oncomplete = function(event) {};
		};
		return Promised(db_request);
	});
}


function TimeListEntries(func) {
  var transaction;
  return OpenDatabase().then(function(db) {
    transaction = db.transaction(['entries'], 'readonly');
    var modified = transaction.objectStore('entries').index('modified');
    return ForCursor(100, modified.openCursor(null, 'prev'),
        function(cursor) {
      return func(cursor.value);
    });
  });
}


function FirstPendingEntry() {
  var entries = document.getElementById('entries');
  var transaction;
  return OpenDatabase().then(function(db) {
    transaction = db.transaction(['entries'], 'readonly');
    var pending = transaction.objectStore('entries').index('pending');
    return Promised(pending.openCursor(IDBKeyRange.only(1)));
  }).then(function(cursor) {
    if (cursor) {
      return cursor.value;
    } else {
      return null;
    }
  });
}


function GetLastCommittedDate() {
  var entries = document.getElementById('entries');
  var transaction;
  return OpenDatabase().then(function(db) {
    transaction = db.transaction(['entries'], 'readonly');
    var committed = transaction.objectStore('entries').index('committed');
    return Promised(committed.openCursor(null, 'prev'));
  }).then(function(cursor) {
    if (cursor) {
      return cursor.value.committed;
    } else {
      return 0;
    }
  });
}


function WriteEntry(entry) {
  ExpandEntry(entry);
  var transaction;
  return OpenDatabase().then(function(db) {
    transaction = db.transaction(['entries'], 'readwrite');
  }).then(function() {
    if (entry.server_key && entry.key === undefined) {
      var server_key = transaction.objectStore('entries').index('server_key');
      var request = server_key.get(entry.server_key);
      return Promised(request).then(function(old) {
        if (old !== null && old !== undefined) {
          entry.key = old.key;
        }
      });
    }
  }).then(function() {
    var request = transaction.objectStore('entries').put(entry);
    return Promised(request);
  }).then(function() {
    sync_pending = true;
  });
}
