'use strict';


window.onload = function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(
        '/serviceworker.js').then(function(registration) {
      console.log(
          'Registered service worker with scope: ' + registration.scope);
      InitSync();
    }).catch(function(err) {
      console.log('FAILED to registered service worker');
      InitSync();
    });
  } else {
    InitSync();
  }
  InitPanels();
  InitDrawing();
  InitLocation();
  InitSweep();
  Notification.requestPermission();
}
