'use strict';


var surface = new Surface(512, 512);


var brushes = [
  new Brush(16, 16, 0.3, [0, 0, 0, 255]),  // black small tip
  new Brush(16, 16, 0.3, undefined, [0, 0, 0, 0]),  // fine eraser
  new Brush(32, 32, 0.2, [255, 0, 0, 0]),  // red big tip
  new Brush(32, 32, 0.2, [0, 255, 0, 0]),  // yellow big tip
  new Brush(32, 32, 0.2, [0, 0, 255, 0]),  // blue big tip
  new Brush(32, 32, 0.1),  // smudge

  new Brush(16, 16, 0.3, [0, 0, 0, 255]),  // black small tip
  new Brush(16, 16, 0.3, undefined, [0, 0, 0, 0]),  // fine eraser
  new Brush(32, 32, 0.2, [255, 255, 0, 0]),  // orange big tip
  new Brush(32, 32, 0.2, [0, 255, 255, 0]),  // green big tip
  new Brush(32, 32, 0.2, [255, 0, 255, 0]),  // purple big tip
  new Brush(32, 32, 0.1),  // smudge

  new Brush(16, 16, 0.3, [0, 0, 0, 255]),  // black small tip
  new Brush(16, 16, 0.3, undefined, [0, 0, 0, 0]),  // fine eraser
  new Brush(32, 32, 0.2, [255, 0, 0, 255]),  // black big tip
  new Brush(32, 32, 0.2, [255, 255, 255, 0]),  // gray big tip
  new Brush(32, 32, 0.2, undefined, [0, 0, 0, 0]),  // white big tip
  new Brush(32, 32, 0.1),  // smudge
];
var brush = 0;


function InitDrawing() {
  var touches = [];
  var redraw = true;
  var downSteps = 0;

  var paint_area = document.getElementById('paint_area');

  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var backcanvas = document.getElementById('backcanvas');
  var backcontext = backcanvas.getContext('2d');
  var backbuffer = backcontext.createImageData(surface.width, surface.height);

  function Exchange() {
    if (touches.length === 0) {
      return;
    }
    var x = touches[0].pageX;
    var y = touches[0].pageY;
    x -= canvas.clientWidth / 2;
    y -= canvas.clientHeight / 2;
    if (canvas.clientWidth < canvas.clientHeight) {
      x /= canvas.clientWidth;
      y /= canvas.clientWidth;
    } else {
      x /= canvas.clientHeight;
      y /= canvas.clientHeight;
    }
    x *= surface.width;
    y *= surface.height;
    x += surface.width / 2;
    y += surface.height / 2;
    brushes[brush].paint(surface, x, y);
    redraw = true;
  }

  var mouseUp = function(event) {
    downSteps--;
    if (downSteps === 0) {
      touches = [];
      document.removeEventListener('mouseup', mouseUp, false);
      document.removeEventListener('mousemove', mouseMove, false);
    } else {
      touches = [event];
    }
    redraw = true;
    Exchange();
    event.preventDefault();
  };
  var mouseMove = function(event) {
    if (downSteps === 0) {
      touches = [];
    } else {
      touches = [event];
    }
    redraw = true;
    Exchange();
    event.preventDefault();
  };
  canvas.addEventListener('mousedown', function(event) {
    touches = [event];
    redraw = true;
    downSteps++;
    Exchange();
    document.addEventListener('mouseup', mouseUp, false);
    document.addEventListener('mousemove', mouseMove, false);
    event.preventDefault();
  }, false);
  canvas.addEventListener('touchmove', function(event) {
    touches = event.touches;
    redraw = true;
    Exchange();
    event.preventDefault();
  }, false);
  canvas.addEventListener('touchstart', function(event) {
    touches = event.touches;
    redraw = true;
    Exchange();
    event.preventDefault();
  }, false);
  canvas.addEventListener('touchend', function(event) {
    touches = event.touches;
    redraw = true;
    Exchange();
    event.preventDefault();
  }, false);

  function Draw() {
    var w = paint_area.clientWidth;
    var h = paint_area.clientHeight;
    if (context.canvas.width !== w ||
        context.canvas.height !== h) {
      redraw = true;
    }

    if (!redraw) return;
    redraw = false;

    surface.convert(backbuffer.data);
    backcontext.putImageData(backbuffer, 0, 0);

    context.canvas.width = w;
    context.canvas.height = h;

    context.fillStyle = 'rgb(0,0,0)';
    context.fillRect(0, 0, w, h);

    if (w > h) {
      var m = Math.floor(w/2) - Math.floor(h/2);
      context.drawImage(
          backcanvas, 0, 0, surface.width, surface.height, m, 0, h, h);
    } else {
      var m = Math.floor(h/2) - Math.floor(w/2);
      context.drawImage(
          backcanvas, 0, 0, surface.width, surface.height, 0, m, w, w);
    }
/*
    if (touches !== null) {
      for (var i = 0; i < touches.length; i++) {
        var touch = touches[i];
        context.fillStyle = 'rgb(0,0,' + Math.floor(touch.force * 255) + ')';
        context.beginPath();
        context.ellipse(
            touch.pageX, touch.pageY,
            20, 20, 0,
            0, 2*Math.PI, true);
        context.fill();
      }
    }
    */
  }

  setInterval(Draw, 10);
}
