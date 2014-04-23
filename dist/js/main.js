(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var App, math;

math = require('mathjs')();

App = (function() {
  function App(canvas, samplerate) {
    this.canvas = canvas;
    this.samplerate = samplerate;
    this.canvas.height = window.innerHeight;
    this.canvas.width = window.innerWidth;
    this.signalHistory = [];
    this.currentSignal = null;
    this.signalColors = [];
    this.dragging = false;
    this.zoom = 1;
    this.yZoom = 160;
    this.origoX = window.innerWidth / 2;
    this.origoY = window.innerHeight / 2;
    this.audioCtx = new webkitAudioContext();
    this.ctx = canvas.getContext("2d");
    this.canvas.addEventListener('mousedown', ((function(_this) {
      return function(event) {
        return _this.mousedownHandler(event);
      };
    })(this)));
    this.canvas.addEventListener('mouseup', ((function(_this) {
      return function(event) {
        return _this.mouseupHandler(event);
      };
    })(this)));
    this.canvas.addEventListener('mousewheel', ((function(_this) {
      return function(event) {
        return _this.scrollHandler(event);
      };
    })(this)));
    this.canvas.addEventListener('keydown', ((function(_this) {
      return function(event) {
        return _this.keydownHandler(event);
      };
    })(this)));
    this.canvas.addEventListener('dblclick', ((function(_this) {
      return function(event) {
        return _this.dblclickHandler(event);
      };
    })(this)));
    this.initGain();
  }

  App.prototype.initGain = function() {
    this.gain = this.audioCtx.createGain();
    this.gain.gain.value = 0.5;
    this.gain.connect(this.audioCtx.destination);
    return this;
  };

  App.prototype.setLineWidth = function(lineWidth) {
    this.ctx.lineWidth = lineWidth;
    return this;
  };

  App.prototype.setSignalColors = function(signalColors) {
    this.signalColors = signalColors;
    return this;
  };

  App.prototype.nextColor = function() {
    var nSignals;
    nSignals = this.sidebar != null ? this.sidebar.signals.length : this.signalHistory.length;
    return this.signalColors[nSignals % this.signalColors.length];
  };

  App.prototype.add = function(signal) {
    if (this.sidebar != null) {
      this.sidebar.add(signal);
    } else {
      this.signalHistory.push(signal);
    }
    signal.color = this.nextColor();
    if (this.currentSignal != null) {
      this.currentSignal.stop();
    }
    this.currentSignal = signal;
    return this.draw();
  };

  App.prototype.draw = function() {
    var delta, expr, i, scope, _fn, _i, _ref;
    this.clear();
    expr = math.parse(this.currentSignal.fn).compile(math);
    delta = this.zoom / this.canvas.width;
    scope = {
      x: this.graphXToSeconds(0)
    };
    this.ctx.moveTo(0, expr["eval"](scope));
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.currentSignal.color;
    _fn = (function(_this) {
      return function(i) {
        scope.x += delta;
        return _this.ctx.lineTo(i, _this.yZoom * expr["eval"](scope) + _this.origoY);
      };
    })(this);
    for (i = _i = 1, _ref = this.ctx.canvas.width - 1; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
      _fn(i);
    }
    this.ctx.stroke();
    this.ctx.closePath();
    this.drawOrigoIndicator();
    this.drawSelection();
    return this.drawEdgeIndicator();
  };

  App.prototype.drawOrigoIndicator = function() {
    this.ctx.beginPath();
    this.ctx.strokeStyle = "#93a1a1";
    this.ctx.moveTo(this.origoX, 0);
    this.ctx.lineTo(this.origoX, 25);
    this.ctx.stroke();
    this.ctx.closePath();
    return this;
  };

  App.prototype.drawSelection = function() {
    var from, to;
    from = this.currentSignal.window.from;
    to = this.currentSignal.window.to;
    if (to !== from || this.dragging) {
      this.ctx.fillStyle = "rgba(238, 232, 213, 0.5)";
      this.ctx.fillRect(this.secondsToGraphX(from), 0, this.secondsToGraphX(to) - this.secondsToGraphX(from), window.innerHeight);
      this.ctx.beginPath();
      this.ctx.strokeStyle = "#93a1a1";
      this.ctx.moveTo(this.secondsToGraphX(from), 0);
      this.ctx.lineTo(this.secondsToGraphX(from), window.innerHeight);
      this.ctx.moveTo(this.secondsToGraphX(to), 0);
      this.ctx.lineTo(this.secondsToGraphX(to), window.innerHeight);
      this.ctx.stroke();
      this.ctx.closePath();
      this.drawSelectionIndicators();
    }
    return this;
  };

  App.prototype.drawSelectionIndicators = function() {
    var fromX, fromY, lMargin, leftOffset, rMargin, rightOffset, toX, toY;
    this.ctx.font = "20pt Georgia";
    this.ctx.fillStyle = "#586e75";
    leftOffset = -95;
    rightOffset = 20;
    if (this.sidebar != null) {
      lMargin = this.sidebar.hidden ? 150 : 350;
    } else {
      lMargin = 100;
    }
    rMargin = 100;
    fromX = this.secondsToGraphX(this.currentSignal.window.from);
    toX = this.secondsToGraphX(this.currentSignal.window.to);
    if (this.currentSignal.window.from < this.currentSignal.window.to) {
      fromX += fromX > lMargin ? leftOffset : rightOffset;
      toX += window.innerWidth - toX > rMargin ? rightOffset : leftOffset;
      if (toX - fromX < 80) {
        toY = 60;
      } else {
        toY = 30;
      }
      fromY = 30;
    } else {
      fromX += window.innerWidth - fromX > rMargin ? rightOffset : leftOffset;
      toX += toX > lMargin ? leftOffset : rightOffset;
      if (fromX - toX < 80) {
        fromY = 60;
      } else {
        fromY = 30;
      }
      toY = 30;
    }
    this.ctx.fillText(this.currentSignal.window.from.toFixed(2) + 's', fromX, fromY);
    this.ctx.fillText(this.currentSignal.window.to.toFixed(2) + 's', toX, toY);
    return this;
  };

  App.prototype.drawEdgeIndicator = function() {
    this.ctx.font = "20pt Georgia";
    this.ctx.fillStyle = "#586e75";
    this.ctx.fillText(this.graphXToSeconds(window.innerWidth).toFixed(1) + 's', window.innerWidth - 80, window.innerHeight - 20);
    return this;
  };

  App.prototype.secondsToGraphX = function(s) {
    return ((s * this.canvas.width) / this.zoom) + this.origoX;
  };

  App.prototype.graphXToSeconds = function(x) {
    return (x - this.origoX) * this.zoom / this.canvas.width;
  };

  App.prototype.keydownHandler = function(event) {
    if ((this.currentSignal != null) && event.keyCode === 32) {
      if (Math.abs(this.currentSignal.window.from) < Math.abs(this.currentSignal.window.to)) {
        this.zoomFitToEdge(this.currentSignal.window.to);
      } else {
        this.zoomFitToEdge(this.currentSignal.window.from);
      }
      this.draw();
    }
    return this;
  };

  App.prototype.zoomFitToEdge = function(s) {
    this.zoom = s * this.canvas.width;
    if (s > 0) {
      this.zoom /= window.innerWidth - this.origoX;
    } else if (s < 0) {
      if (this.sidebar != null) {
        if (this.sidebar.hidden) {
          this.zoom /= this.sidebar.hiddenWidth - this.origoX;
        } else {
          this.zoom /= this.sidebar.width - this.origoX;
        }
      } else {
        this.zoom /= -this.origoX;
      }
    }
    return this;
  };

  App.prototype.dblclickHandler = function(event) {
    event.preventDefault();
    this.origoX = event.x;
    this.dragging = false;
    return this.draw();
  };

  App.prototype.mousedownHandler = function(event) {
    event.preventDefault();
    this.origoX = event.x;
    if (this.currentSignal != null) {
      this.dragging = true;
      this.startDrag(event);
    }
    return this;
  };

  App.prototype.mouseupHandler = function(event) {
    if (this.currentSignal != null) {
      if (this.dragging) {
        this.dragging = false;
        this.canvas.onmousemove = null;
        this.endDrag(event);
      }
      this.currentSignal.play(this.audioCtx, this.gain);
    }
    return this;
  };

  App.prototype.scrollHandler = function(event) {
    event.preventDefault();
    if (this.zoom > 10) {
      this.zoom += event.deltaY;
    } else if (this.zoom > 1) {
      this.zoom += event.deltaY / 10;
    } else if (this.zoom >= 0) {
      this.zoom += event.deltaY / 100;
    } else {
      this.zoom = 0;
    }
    return this.draw();
  };

  App.prototype.startDrag = function(event) {
    this.currentSignal.startWindowSelection(this.graphXToSeconds(event.x));
    this.canvas.onmousemove = ((function(_this) {
      return function(event) {
        return _this.endDrag(event);
      };
    })(this));
    return this.draw();
  };

  App.prototype.endDrag = function(event) {
    this.currentSignal.endWindowSelection(this.graphXToSeconds(event.x));
    return this.draw();
  };

  App.prototype.clear = function() {
    return this.canvas.height = this.canvas.height;
  };

  return App;

})();

module.exports = App;


},{}],2:[function(require,module,exports){
"use strict";
var Sidebar;

Sidebar = (function() {
  function Sidebar(sidebar, width, hidden) {
    this.sidebar = sidebar;
    this.width = width;
    this.hidden = hidden != null ? hidden : true;
    this.signals = [];
    this.sidebar.style.width = this.width + "px";
    this.signalList = document.createElement('ul');
    this.sidebar.appendChild(this.signalList).className = "sidebar-signal-list";
    this.hiddenWidth = 55;
    if (this.hidden) {
      this.hide();
    } else {
      this.show();
    }
  }

  Sidebar.prototype.bindButton = function(button) {
    this.button = button;
    this.button.innerHTML = this.hidden ? ">>" : "<<";
    return this.button.addEventListener('click', ((function(_this) {
      return function(event) {
        return _this.toggle();
      };
    })(this)));
  };

  Sidebar.prototype.toggle = function() {
    this.hidden = !this.hidden;
    this.button.innerHTML = this.hidden ? ">>" : "<<";
    if (this.hidden) {
      return this.hide();
    } else {
      return this.show();
    }
  };

  Sidebar.prototype.show = function() {
    this.sidebar.style.left = 0 + "px";
    return this;
  };

  Sidebar.prototype.hide = function() {
    this.sidebar.style.left = (this.hiddenWidth - this.width) + "px";
    return this;
  };

  Sidebar.prototype.add = function(signal) {
    this.signalList.insertBefore(this.makeEntry(signal), this.signalList.firstChild);
    this.signals.push(signal);
    return this;
  };

  Sidebar.prototype.makeEntry = function(signal) {
    var entry, title, toggles, txt;
    entry = document.createElement('li');
    title = document.createTextNode(signal.fn);
    toggles = document.createElement('div');
    toggles.style.background = signal.color;
    txt = document.createTextNode('');
    toggles.appendChild(txt);
    entry.appendChild(title);
    entry.appendChild(toggles).className = 'sidebar-signal-toggle';
    entry.className = 'sidebar-signal';
    return entry;
  };

  return Sidebar;

})();

module.exports = Sidebar;


},{}],3:[function(require,module,exports){
"use strict";
var Signal, math;

math = require('mathjs')();

Signal = (function() {
  function Signal(fn, samplerate) {
    this.fn = fn;
    this.samplerate = samplerate;
    this.playing = false;
    this.window = {
      from: 0,
      to: 0
    };
    this.samples = [];
    this;
  }

  Signal.prototype.sample = function() {
    var delta, end, expr, i, nSamples, scope, start, _fn, _i, _ref;
    if (this.window.from < this.window.to) {
      start = this.window.from;
      end = this.window.to;
    } else {
      start = this.window.to;
      end = this.window.from;
    }
    nSamples = Math.floor((end - start) * this.samplerate);
    this.samples = new Float32Array(nSamples);
    delta = 1 / this.samplerate;
    expr = math.parse(this.fn).compile(math);
    scope = {
      x: start
    };
    _fn = (function(_this) {
      return function() {
        scope.x += delta;
        return _this.samples[i] = expr["eval"](scope);
      };
    })(this);
    for (i = _i = 0, _ref = nSamples - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      _fn();
    }
    return this;
  };

  Signal.prototype.createBufferSource = function(ctx) {
    var buffer, data, i, _fn, _i, _ref;
    buffer = ctx.createBuffer(1, this.samples.length, this.samplerate);
    data = buffer.getChannelData(0);
    _fn = (function(_this) {
      return function(i) {
        return data[i] = _this.samples[i];
      };
    })(this);
    for (i = _i = 0, _ref = this.samples.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      _fn(i);
    }
    this.source = ctx.createBufferSource();
    this.source.loop = true;
    this.source.buffer = buffer;
    return this;
  };

  Signal.prototype.connect = function(gain) {
    this.source.connect(gain);
    return this;
  };

  Signal.prototype.play = function(ctx, gain) {
    if (this.playing) {
      this.stop();
    }
    if (this.window.from !== this.window.to) {
      this.playing = true;
      this.sample();
      this.createBufferSource(ctx);
      this.connect(gain);
      this.source.noteOn(0);
    }
    return this;
  };

  Signal.prototype.stop = function() {
    if (this.playing) {
      this.source.noteOff(0);
    }
    this.playing = false;
    return this;
  };

  Signal.prototype.startWindowSelection = function(s) {
    this.window.from = s;
    this.window.to = s;
    return this;
  };

  Signal.prototype.endWindowSelection = function(s) {
    this.window.to = s;
    return this;
  };

  return Signal;

})();

module.exports = Signal;


},{}],4:[function(require,module,exports){
"use strict";
var $, App, Sidebar, Signal, app, samplerate;

App = require('./App.coffee');

Signal = require('./Signal.coffee');

Sidebar = require('./Sidebar.coffee');

$ = document.querySelector.bind(document);

samplerate = 48000;

app = new App($('#graph'), samplerate);

app.sidebar = new Sidebar($('#sidebar'), 250);

app.sidebar.bindButton($('#sidebar-toggle'));

app.setSignalColors(["#b58900", "#dc322f", "#d33682", "#6c71c4", "#268bd2", "#2aa198", "#cb4b16", "#859900"]).setLineWidth(3);

$('#fn-input').onkeypress = function(event) {
  var signal;
  if (event.keyCode === 13) {
    signal = new Signal(this.value, samplerate);
    return app.add(signal);
  }
};


},{"./App.coffee":1,"./Sidebar.coffee":2,"./Signal.coffee":3}]},{},[4])