'use strict';


function Brush(width, height, rate, color, clear) {
  this.surface = new Surface(width, height);
  this.rate = rate;
  this.color = color;
  this.clear = clear;
}

Brush.prototype.paint = function(surface, x, y) {
  if (this.color !== undefined) {
    this.surface.inject(this.color);
  }
  if (this.clear !== undefined) {
    this.surface.clear(this.clear);
  }
  surface.exchange(this.surface, x, y, this.rate);
};
