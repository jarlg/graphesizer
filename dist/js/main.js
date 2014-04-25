(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var App, Audio, Graph, GraphView, Sidebar, SidebarView, Signal, math;

math = require('mathjs')();

Signal = require('./Signal.coffee');

Audio = require('./Audio.coffee');

GraphView = require('./GraphView.coffee');

Graph = require('./Graph.coffee');

Sidebar = require('./Sidebar.coffee');

SidebarView = require('./SidebarView.coffee');

App = (function() {
  function App(canvas, sidebar, input, samplerate) {
    this.canvas = canvas;
    this.input = input;
    this.samplerate = samplerate;
    this.currentSignal = null;
    this.signalColors = [];
    this.gView = new GraphView(this.canvas, this);
    this.graph = new Graph(this.gView);
    this.sidebarView = new SidebarView(sidebar, this);
    this.sidebar = new Sidebar(this.sidebarView);
    this.audio = new Audio(new webkitAudioContext(), this);
    this.input.addEventListener('keydown', (function(_this) {
      return function() {
        return _this.updateCurrentSignal();
      };
    })(this));
  }

  App.prototype.setLineWidth = function(lineWidth) {
    this.gView.ctx.lineWidth = lineWidth;
    return this;
  };

  App.prototype.setSignalColors = function(signalColors) {
    this.signalColors = signalColors;
    return this;
  };

  App.prototype.nextColor = function() {
    return this.signalColors[this.sidebar.signals.length % this.signalColors.length];
  };

  App.prototype.validate = function(value) {
    var e, expr;
    try {
      expr = math.parse(value).compile(math);
      return true;
    } catch (_error) {
      e = _error;
      return false;
    }
  };

  App.prototype.updateCurrentSignal = function() {
    var e, oldSignalState;
    if (this.validate(this.input.value)) {
      if (this.currentSignal != null) {
        oldSignalState = this.currentSignal.state();
        try {
          return this.currentSignal.update({
            fn: this.input.value,
            window: {
              to: this.graph.selection.to,
              from: this.graph.selection.from
            }
          });
        } catch (_error) {
          e = _error;
          return this.currentSignal.update(oldSignalState);
        }
      } else {
        try {
          return this.currentSignal = new Signal(this.input.value, this.audio);
        } catch (_error) {
          e = _error;
          return this.currentSignal = null;
        }
      }
    }
  };

  return App;

})();

module.exports = App;


},{"./Audio.coffee":2,"./Graph.coffee":3,"./GraphView.coffee":4,"./Sidebar.coffee":5,"./SidebarView.coffee":6,"./Signal.coffee":7}],2:[function(require,module,exports){
'use strict';
var Audio;

Audio = (function() {
  function Audio(ctx, app) {
    this.ctx = ctx;
    this.app = app;
    this.playing = false;
    this.source = null;
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.5;
    this.gain.connect(this.ctx.destination);
  }

  Audio.prototype.update = function(model) {
    return this.createBufferSource(model.sample(this.app.samplerate));
  };

  Audio.prototype.createBufferSource = function(samples) {
    var buffer, data, i, _fn, _i, _ref;
    if (samples.length > 0) {
      buffer = this.ctx.createBuffer(1, samples.length, this.app.samplerate);
      data = buffer.getChannelData(0);
      _fn = function(data, i, samples) {
        return data[i] = samples[i];
      };
      for (i = _i = 0, _ref = samples.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        _fn(data, i, samples);
      }
      this.source = ctx.createBufferSource();
      this.source.loop = true;
      return this.source.buffer = buffer;
    } else {
      return this.source = null;
    }
  };

  Audio.prototype.play = function() {
    if ((this.source != null) && !this.playing) {
      this.source.connect(this.gain);
      this.source.noteOn(0);
      return this.playing = true;
    }
  };

  Audio.prototype.stop = function() {
    if ((this.source != null) && this.playing) {
      this.source.noteOff(0);
    }
    return this.playing = false;
  };

  return Audio;

})();

module.exports = Audio;


},{}],3:[function(require,module,exports){
'use strict';
var Graph, math;

math = require('mathjs')();

Graph = (function() {
  function Graph(view) {
    this.view = view;
    this.origoX = window.innerWidth / 2;
    this.origoY = window.innerHeight / 2;
    this.dragging = false;
    this.selection = {
      from: 0,
      to: 0
    };
    this.zoom = 1;
    this.zoomY = 180;
    this.view.update(this);
    this;
  }

  Graph.prototype.options = {
    hoverMargin: 20,
    selectionEdgeColor: "#93a1a1",
    selectionEdgeFocusColor: "#586e75",
    selectionFillColor: "rgba(238, 232, 213, 0.5)"
  };

  Graph.prototype.secondsToX = function(s) {
    return ((s * this.canvas.width) / this.zoom) + this.origoX;
  };

  Graph.prototype.xToSeconds = function(x) {
    return (x - this.origoX) * this.zoom / this.canvas.width;
  };

  Graph.prototype._dist = function(x1, x2) {
    return Math.abs(x1 - x2);
  };

  Graph.prototype.hovering = function(x) {
    if (this._dist(this.selection.to, x) < this._dist(this.selection.from, x)) {
      if (this._dist(this.selection.to, x) < this.options.hoverMargin) {
        return this.selection.to;
      }
    } else if (this.selection.to !== this.selection.from) {
      if (this._dist(this.selection.from, x) < this.options.hoverMargin) {
        return this.selection.from;
      }
    }
    return null;
  };

  Graph.prototype.setZoom = function(zoom) {
    this.zoom = zoom;
    return this.view.update(this);
  };

  Graph.prototype.setSelection = function(selection) {
    this.selection = selection;
    return this.view.update(this);
  };

  Graph.prototype.setDragging = function(dragging) {
    this.dragging = dragging;
    return this.view.update(this);
  };

  Graph.prototype.setOrigoX = function(origoX) {
    this.origoX = origoX;
    return this.view.update(this);
  };

  return Graph;

})();

module.exports = Graph;


},{}],4:[function(require,module,exports){
'use strict';
var GraphView, math;

math = require('mathjs')();

GraphView = (function() {
  function GraphView(canvas, app) {
    this.canvas = canvas;
    this.app = app;
    this.canvas.height = window.innerHeight;
    this.canvas.width = window.innerWidth;
    this.ctx = this.canvas.getContext("2d");
    this;
  }

  GraphView.prototype.clear = function() {
    return this.canvas.width = this.canvas.width;
  };

  GraphView.prototype.update = function(graph) {
    if (this.app.currentSignal != null) {
      return this.draw(this.app.currentSignal, graph);
    }
  };

  GraphView.prototype.draw = function(signal, graph) {
    var fromX, toX;
    toX = graph.secondsToX(graph.selection.to);
    fromX = graph.secondsToX(graph.selection.from);
    this.drawSignal(signal, graph.zoom, graph.zoomY, graph.origoX, graph.origoY);
    this.drawTotalSecondsOnScreen(graph.xToSeconds(window.innerWidth + graph.origoX));
    this.drawOrigoIndicator(graph.origoX);
    this.drawSelection(toX, fromX, graph.dragging, graph.options);
    this.drawSelectionText(!this.app.sidebar.hidden, graph.selection.from, graph.selection.to, fromX, toX);
    if (graph.dragging) {
      this.drawSelectionEdge(fromX, false, graph.options);
      this.drawSelectionEdge(toX, true, graph.options);
    } else {
      this.drawSelectionEdge(fromX, graph.hovering(fromX, graph.options));
      this.drawSelectionEdge(toX, graph.hovering(toX, graph.options));
    }
    return this;
  };

  GraphView.prototype.drawSignal = function(signal, zoom, zoomY, origoX, origoY) {
    var delta, expr, i, scope, _fn, _i, _ref;
    expr = math.parse(signal.fn).compile(math);
    delta = zoom / this.canvas.width;
    scope = {
      x: origoX
    };
    this.ctx.moveTo(0, expr["eval"](scope));
    this.ctx.beginPath();
    this.ctx.strokeStyle = signal.color;
    _fn = (function(_this) {
      return function() {
        scope.x += delta;
        return _this.ctx.lineTo(i, zoomY * expr["eval"](scope) + origoY);
      };
    })(this);
    for (i = _i = 1, _ref = this.ctx.canvas.width - 1; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
      _fn();
    }
    this.ctx.stroke();
    this.ctx.closePath();
    return this;
  };

  GraphView.prototype.drawTotalSecondsOnScreen = function(seconds) {
    this.ctx.font = "20pt Georgia";
    this.ctx.fillStyle = "#586e75";
    this.ctx.fillText(seconds.toFixed(1) + 's', window.innerWidth - 80, window.innerHeight - 20);
    return this;
  };

  GraphView.prototype.drawOrigoIndicator = function(origoX) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = "#93a1a1";
    this.ctx.moveTo(origoX, 0);
    this.ctx.lineTo(origoX, 25);
    this.ctx.stroke();
    this.ctx.closePath();
    return this;
  };

  GraphView.prototype.drawSelection = function(toX, fromX, dragging, options) {
    if (toX !== fromX || dragging) {
      this.ctx.fillStyle = options.selectionFillColor;
      this.ctx.fillRect(fromX, 0, toX - fromX, window.innerHeight);
    }
    return this;
  };

  GraphView.prototype.drawSelectionEdge = function(x, hovering, options) {
    if (hovering != null) {
      this.ctx.beginPath();
      if (hovering) {
        this.ctx.strokeStyle = options.selectionEdgeFocusColor;
      } else {
        this.ctx.strokeStyle = options.selectionEdgeColor;
      }
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, window.innerHeight);
      this.ctx.stroke();
      return this.ctx.closePath();
    }
  };

  GraphView;

  return GraphView;

})();

({
  drawSelectionText: function(sidebarShowing, from, to, fromX, toX) {
    var fromY, lMargin, leftOffset, rMargin, rightOffset, toY;
    this.ctx.font = "20pt Georgia";
    this.ctx.fillStyle = "#586e75";
    leftOffset = -95;
    rightOffset = 20;
    if (sidebarShowing != null) {
      lMargin = sidebarShowing ? 350 : 150;
    } else {
      lMargin = 100;
    }
    rMargin = 100;
    if (from < to) {
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
    this.ctx.fillText(from.toFixed(2) + 's', fromX, fromY);
    this.ctx.fillText(to.toFixed(2) + 's', toX, toY);
    return this;
  }
});

module.exports = GraphView;


},{}],5:[function(require,module,exports){
"use strict";
var Sidebar;

Sidebar = (function() {
  function Sidebar(view, hidden) {
    this.view = view;
    this.hidden = hidden != null ? hidden : true;
    this.signals = [];
    this.view.update(this);
  }

  Sidebar.prototype.add = function(signal) {
    this.signals.push(signal);
    return this.view.add(signal);
  };

  return Sidebar;

})();

module.exports = Sidebar;


},{}],6:[function(require,module,exports){
'use strict';
var SidebarView;

SidebarView = (function() {
  function SidebarView(el, app) {
    this.el = el;
    this.app = app;
    this.width = 250;
    this.hiddenWidth = 55;
    this.button = document.createElement('button');
    this.button.addEventListener('click', (function(_this) {
      return function() {
        return _this.toggle();
      };
    })(this));
    this.el.appendChild(this.button).id = 'sidebar-toggle';
    this.signalList = document.createElement('ul');
    this.el.appendChild(this.signalList).className = 'sidebar-signal-list';
  }

  SidebarView.prototype.update = function(model) {
    this.el.style.width = model.width + "px";
    if (model.hidden) {
      return this.hide();
    } else {
      return this.show();
    }
  };

  SidebarView.prototype.add = function(signal) {
    return this.signalList.insertBefore(this.makeEntry(signal), this.signalList.firstChild);
  };

  SidebarView.prototype.show = function() {
    this.button.innerHTML = '<<';
    return this.el.style.left = "0px";
  };

  SidebarView.prototype.hide = function() {
    this.button.innerHTML = '>>';
    return this.el.style.left = (this.hiddenWidth - this.width) + "px";
  };

  SidebarView.prototype.toggle = function() {
    this.app.sidebar.hidden = !this.app.sidebar.hidden;
    if (this.app.sidebar.hidden) {
      return this.hide();
    } else {
      return this.show();
    }
  };

  SidebarView.prototype.makeEntry = function(signal) {
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

  return SidebarView;

})();

module.exports = SidebarView;


},{}],7:[function(require,module,exports){
"use strict";
var Signal, math,
  __hasProp = {}.hasOwnProperty;

math = require('mathjs')();

Signal = (function() {
  function Signal(fn, view) {
    this.fn = fn;
    this.view = view;
    this.window = {
      from: 0,
      to: 0
    };
  }

  Signal.prototype.sample = function(samplerate) {
    var delta, end, expr, i, nSamples, samples, scope, start, _fn, _i, _ref;
    if (this.window.from < this.window.to) {
      start = this.window.from;
      end = this.window.to;
    } else {
      start = this.window.to;
      end = this.window.from;
    }
    nSamples = Math.floor((end - start) * samplerate);
    samples = new Float32Array(nSamples);
    delta = 1 / samplerate;
    expr = math.parse(this.fn).compile(math);
    scope = {
      x: start
    };
    _fn = (function(_this) {
      return function() {
        scope.x += delta;
        return samples[i] = expr["eval"](scope);
      };
    })(this);
    for (i = _i = 0, _ref = nSamples - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      _fn();
    }
    return samples;
  };

  Signal.prototype.update = function(obj) {
    var key, updateView, val, _fn;
    updateView = false;
    _fn = (function(_this) {
      return function() {
        if ((val != null) && _this[key] !== val) {
          _this[key] = val;
          return updateView = true;
        }
      };
    })(this);
    for (key in obj) {
      if (!__hasProp.call(obj, key)) continue;
      val = obj[key];
      _fn();
    }
    if (updateView) {
      return this.view.update(this);
    }
  };

  Signal.prototype.state = function() {
    return {
      fn: this.fn,
      window: {
        from: this.window.from,
        to: this.window.to
      }
    };
  };

  return Signal;

})();

module.exports = Signal;


},{}],8:[function(require,module,exports){
'use strict';
var $, App, app, samplerate;

App = require('./AppController.coffee');

$ = document.querySelector.bind(document);

samplerate = 48000;

app = new App($('#graph'), $('#sidebar'), $('#fn-input'), samplerate);

app.setSignalColors(["#b58900", "#dc322f", "#d33682", "#6c71c4", "#268bd2", "#2aa198", "#cb4b16", "#859900"]).setLineWidth(3);


},{"./AppController.coffee":1}]},{},[8])