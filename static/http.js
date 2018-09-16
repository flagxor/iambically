'use strict';


function HttpPost(url, data) {
  var formData = new FormData();
  for (var k in data) {
    if (data[k] !== null && data[k] !== undefined) {
      formData.append(k, data[k]);
    }
  }
  return new Promise(function(resolve, reject) {
    var r = new XMLHttpRequest();
    r.open('POST', url);
    r.onreadystatechange = function() {
      if (r.readyState === 4) {
        if (r.status === 200) {
          resolve(r.responseText);
        } else {
          reject(r.status);
        }
      }
    };
    r.send(formData);
  });
}


function HttpGet(url, data) {
  return new Promise(function(resolve, reject) {
    var r = new XMLHttpRequest();
    r.open('GET', url);
    r.onreadystatechange = function() {
      if (r.readyState === 4) {
        if (r.status === 200) {
          resolve(r.responseText);
        } else {
          reject(r.status);
        }
      }
    };
    r.send();
  });
}
