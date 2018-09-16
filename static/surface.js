'use strict';


function Surface(width, height) {
  this.width = width;
  this.height = height;
  this.data = new Uint8Array(width * height * 4);
  this.mask = new Uint8Array(width * height);
  this.initMask();
}

Surface.prototype.initMask = function() {
  var width = this.width;
  var height = this.height;
  var mask = this.mask;
  var rr = (width / 2) * (height / 2);
  var pos = 0;
  for (var j = 0; j < height; j++) {
    for (var i = 0; i < width; i++) {
      var dx = i - width / 2;
      var dy = j - height / 2;
      var dd = dx * dx + dy * dy;
      if (dd < rr) {
        mask[pos++] = Math.floor((rr - dd) * 255 / rr);
      } else {
        mask[pos++] = 0;
      }
    }
  }
}

Surface.prototype.inject = function(color) {
  var c0 = color[0] | 0;
  var c1 = color[1] | 0;
  var c2 = color[2] | 0;
  var c3 = color[3] | 0;
  var size = this.width * this.height * 4;
  var data = this.data;
  for (var i = 0; i < size; i += 4) {
    data[i + 0] = Math.min(255, c0 + data[i + 0]);
    data[i + 1] = Math.min(255, c1 + data[i + 1]);
    data[i + 2] = Math.min(255, c2 + data[i + 2]);
    data[i + 3] = Math.min(255, c3 + data[i + 3]);
  }
};

Surface.prototype.clear = function(color) {
  var c0 = color[0] | 0;
  var c1 = color[1] | 0;
  var c2 = color[2] | 0;
  var c3 = color[3] | 0;
  var size = this.width * this.height * 4;
  var data = this.data;
  for (var i = 0; i < size; i += 4) {
    data[i + 0] = c0;
    data[i + 1] = c1;
    data[i + 2] = c2;
    data[i + 3] = c3;
  }
};

Surface.prototype.convert = function(dst) {
  var size = this.width * this.height * 4;
  var src = this.data;
  for (var i = 0; i < size; i += 4) {
    var r = src[i + 0];
    var y = src[i + 1];
    var b = src[i + 2];
    var k = 255 - src[i + 3];
    dst[i + 0] = (k * (255 - (b >> 1))) >> 8;
    dst[i + 1] = (k * (255 - (r >> 1)) * (255 - (b >> 2))) >> 16;
    dst[i + 2] = (k * (255 - (r >> 1)) * (255 - y)) >> 16;
    dst[i + 3] = 255;
  }
};

Surface.prototype.convertPlane = function(plane, dst) {
  var size = this.width * this.height * 4;
  var src = this.data;
  for (var i = 0; i < size; i += 4) {
    dst[i + 0] = src[i + plane];
    dst[i + 1] = src[i + plane];
    dst[i + 2] = src[i + plane];
    dst[i + 3] = 255;
  }
};

Surface.prototype.loadPlane = function(plane, src) {
  var size = this.width * this.height * 4;
  var dst = this.data;
  for (var i = 0; i < size; i += 4) {
    dst[i + plane] = src[i];
  }
};

Surface.prototype.packDataURL = function(url) {
  console.log('image of size: ' + url.length);
  return url;
};

Surface.prototype.unpackDataURL = function(dt) {
  return dt;
};

Surface.prototype.extractImage = function(canvas, format) {
  return this.packDataURL(canvas.toDataURL(format));
};

Surface.prototype.unpackViewImage = function(data) {
  var parts = data.split('|');
  return parts[0];
};

Surface.prototype.import = function(canvas, data) {
  data = data.split('|');
  var self = this;
  var context = canvas.getContext('2d');
  var im = new Image(this.width, this.height);
  return Promise.resolve().then(function() {
    im.src = self.unpackDataURL(data[1]);
    return new Promise(function(resolve) { im.onload = resolve; });
  }).then(function() {
    context.drawImage(im, 0, 0);
    var imdata = context.getImageData(0, 0, self.width, self.height);
    self.loadPlane(0, imdata.data);
    im.src = self.unpackDataURL(data[2]);
    return new Promise(function(resolve) { im.onload = resolve; });
  }).then(function() {
    context.drawImage(im, 0, 0);
    var imdata = context.getImageData(0, 0, self.width, self.height);
    self.loadPlane(1, imdata.data);
    im.src = self.unpackDataURL(data[3]);
    return new Promise(function(resolve) { im.onload = resolve; });
  }).then(function() {
    context.drawImage(im, 0, 0);
    var imdata = context.getImageData(0, 0, self.width, self.height);
    self.loadPlane(2, imdata.data);
    im.src = self.unpackDataURL(data[4]);
    return new Promise(function(resolve) { im.onload = resolve; });
  }).then(function() {
    context.drawImage(im, 0, 0);
    var imdata = context.getImageData(0, 0, self.width, self.height);
    self.loadPlane(3, imdata.data);
  });
};

Surface.prototype.export = function(canvas) {
  var context = canvas.getContext('2d');
  var backbuffer = context.createImageData(this.width, this.height);
  var ret = [];
  for (var i = 0; i < 4; i++) {
    this.convertPlane(i, backbuffer.data);
    context.putImageData(backbuffer, 0, 0);
    ret.push(this.extractImage(canvas, 'image/png'));
  }
  this.convert(backbuffer.data);
  context.putImageData(backbuffer, 0, 0);
  ret.unshift(this.extractImage(canvas, 'image/jpeg'));
  return ret.join('|');
};

Surface.prototype.exchange = function(src, x, y, portion) {
  x = x | 0;
  y = y | 0;
  var portion1 = 1.0 - portion;
  var src_width = src.width;
  var src_height = src.height;
  var dst_width = this.width;
  var dst_height = this.height;

  var sx1 = 0;
  var dx1 = x - ((src_width / 2)|0);
  var sx2 = sx1 + src_width;
  var dx2 = dx1 + src_width;

  var sy1 = 0;
  var dy1 = y - ((src_height / 2)|0);
  var sy2 = sy1 + src_height;
  var dy2 = dy1 + src_height;

  if (dx1 < 0) { sx1 -= dx1; dx1 = 0; }
  if (dy1 < 0) { sy1 -= dy1; dy1 = 0; }
  if (dx2 > dst_width) { sx2 -= (dx2 - dst_width); dx2 = dst_width; }
  if (dy2 > dst_height) { sy2 -= (dy2 - dst_height); dy2 = dst_height; }

  if (dx2 <= dx1 || dy2 <= dy1) {
    return;
  }

  var dst_data = this.data;
  var src_data = src.data;
  var mask_data = src.mask;
  for (var sj = sy1, dj = dy1; sj < sy2; sj++, dj++) {
    for (var si = sx1, di = dx1; si < sx2; si++, di++) {
      for (var p = 0; p < 4; p++) {
        var sposm = si + sj * src_width;
        var m = mask_data[sposm] / 255;
        if (m === 0) continue;
        var dpos = (di + dj * dst_width) * 4 + p;
        var spos = sposm * 4 + p;
        var od = dst_data[dpos];
        var os = src_data[spos];
        var nd = Math.min(255, (os * portion * m + od * (1 - portion * m))|0);
        var ns = os - (nd - od);
        if (ns > 255) {
          nd += (ns - 255);
          ns = 255;
        }
        if (ns < 0) {
          nd += ns;
          ns = 0;
        }
        dst_data[dpos] = nd;
        src_data[spos] = ns;
      }
    }
  }
};
