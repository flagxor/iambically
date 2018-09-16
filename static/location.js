'use strict';


var geoPosition = [0, 0];

function InitLocation() {
  function UpdatePosition(pos) {
    geoPosition = [pos.coords.latitude, pos.coords.longitude];
  }

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(UpdatePosition);
  }
}
