function Graphesizer(canvas) {
    'use strict';
    return this.init(canvas);
}

(function (window, document) {
    'use strict';

    /* -> bool
     * takes two points (click position),
     * and then basically a rectangle: x,y, width, height
     * returns if the two points are within the object
     * fuzzy is the margin/fuzzyness of the hover
     */
    function hover(x, y, x1, y1, width, height, fuzzy) {
        var deltaX = x - x1,
            deltaY = y - y1;
        if (deltaX > -fuzzy && deltaX < width + fuzzy &&
            deltaY > -fuzzy && deltaY < height + fuzzy) {
                return true;
            }
        return false;
    }

    // -> [Amplitude]
    function sampleSignal(signal, rate, duration) {
        /*
         * TODO: forget to clear canvas makes for interesting effects
         */
        signal.audio = [];
        for (var x = 0; x < duration; x += rate) {
            signal.audio.push(signal.amplitude * 
                    Math.sin(2 * Math.PI * signal.frequency * x +
                        signal.phase));
        }

        return signal;
    }

    /* creates a curve based on already sampled audio
    */
    function renderSignal(signal, length, amp_ratio) {
        var origo = signal.context.canvas.height / 2;
        signal.curve = [];
        for (var x = 0; x < length; ++x) {
            signal.curve.push(origo + signal.audio[x] *
                    origo * amp_ratio);
        }
        return signal;
    }

    function drawCurve(context, start, curve, color, stroke_width) {
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = stroke_width;
        context.moveTo(0, curve[start]);

        var y;
        for (var i = 1; i < curve.length; i++) {
            y = curve[(i+start)%curve.length];
            context.lineTo(i, y);
        }
        context.stroke();
    }

    /* -> float distance
     * returns distance between two points
     * using simple pythagoras d = sqrt(abs(x2-x1)**2 + abs(y2-y1)**2)
     */
    function getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(Math.abs(x2 - x1), 2) +
                Math.pow(Math.abs(y2 - y1), 2));
    }

    /* -> { 1, -1 }
     * return 1 for growing (towards right)
     * return -1 for decreasing (towards right)
     */
    function getDirection(signal, x) {
        if ((x >= 0) && (x < signal.curve.length - 1)) {
            return (signal[x] < signal[x+1]) ? 1 : -1;
        }
        else if (x == signal.curve.length - 1) {
            return (signal[x] > signal[x-1]) ? 1 : -1;
        }
        return 0;
    }

    /* -> float distance to curve
     * takes positions x, y and [amplitude]
     */
    function distanceToCurve(x, y, signal) {
        var direction = getDirection(signal, x),
            distance = getDistance(x, signal.curve[x], x, y),
            next_distance = distance,
            closest_x,
            i = 1;

        if (signal[x] == y) {
            return 0; 
        }
        else if (signal[x] > y) {
            direction = -direction;
        }

        do {
            distance = next_distance;
            next_distance = getDistance(x + direction*i,
                    signal.curve[x+direction*i],
                    x,
                    y);
            i++;
        } while(distance > next_distance);

        return distance;
    }

    /* -> int (index of closest signal)
     * takes position of click, list of signals
     */
    function getClosest(x, y, signals, threshold) {
        var distance = threshold,
            index = 0,
            tmp = 0;

        for (var i = 0; i < signals.length; i++) {
            tmp = distanceToCurve(x, y, signals[i]);
            if (tmp < distance) {
                distance = tmp;
                index = i;
            }
        }

        return (distance < threshold) ? index : -1;
    }

    /* -> int (index of color)
     * takes all signals, list of colors and chooses next color
     * if we delete the first wave after having created the second,
     * we want the next created wave to have the color the first wave
     * had.
     */
    function chooseColor(colors, signals) {
        var in_use = false;
        for (var i = 0; i < signals.length; i++) {
            for (var j = 0; j < signals.length; j++) {
                if (signals[j].color == colors[i]) {
                    in_use = true;
                    break;
                }
            }

            if (in_use) {
                in_use = false;
            }
            else {
                return i;
            }
        }

        return signals.length;
    }

    /* PROTOTYPES or something
    */

    function Button(context, x, y, width, height, normalColor, hoverColor) {
        return this.init(context, x, y, width,
                height, normalColor, hoverColor);
    }

    Button.prototype = {
        /* -> this
         * initializes and executes the initial draw of buttons (upon creation)
         */
        init: function (context, x, y, width, height, normalColor, hoverColor) {
            this.context = context;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;

            this.hovering = false;

            this.normalColor = normalColor;
            this.hoverColor = hoverColor;

            this.color = normalColor;

            this.fuzzy = 5;

            this.draw();

            return this;
        },

        draw: function () {
            // empty
        },

        /* -> bool
         * checks if coordinates (x, y) lie over the button (rectangle check)
         * given a certain fuzzyness/margin.
         */
        hover: function (x, y) {
            return hover(x, y, this.x, this.y,
                    this.width, this.height, this.fuzzy);
        },

        /* -> void
         * redraws button if necessary and changes hover state.
         */
        update: function (x, y) {
            if (this.hover(x, y)) {
                if (!this.hovering) {
                    this.hovering = true;
                    this.color = this.hoverColor;
                    this.draw();
                }
            }
            else {
                if (this.hovering) {
                    this.hovering = false;
                    this.color = this.normalColor;
                    this.draw();
                }
            }
        }
    };

    /* OBJECTS for signals, buttons and graphesizer
    */
    function Signal(aContext, context, frequency, color, stroke_width) {
        return this.init(aContext, context,
                frequency, color, stroke_width);
    }

    Signal.prototype = {
        init: function (aContext, context, frequency, color, stroke_width) {
            this.context = context;
            this.aContext = aContext;
            this.frequency = frequency;
            this.color = color;
            this.stroke_width = stroke_width;
            this.phase = 0;
            this.mode = '+'; // possible modes: +, -, / and *
            this.prev_phase = 0;
            this.amplitude = 1;
            this.prev_amplitude = 0;
            this.playing = false;

            this.gain = aContext.createGain();
            this.gain.gain.value= 0.5;
        },
        
        play: function (gainNode) {
            this.osc = this.aContext.createOscillator();
            this.osc.frequency.value = this.frequency;
            this.osc.type = "sine";

            this.osc.connect(this.gain);
            this.gain.connect(gainNode);

            this.osc.start(0);
            this.playing = true;
        },

        stop: function () {
            this.osc.stop(0);
            this.gain.disconnect();
            this.playing = false;
        },

        modulate: function (deltaX, deltaY) {
            this.frequency -= deltaX;
            this.amplitude += deltaY;

            if (this.playing) {
                this.gain.gain.value = this.amplitude * 0.5;
                this.osc.frequency.value = this.frequency;
            }
        },

        dephase: function (delta) {
            // TODO obv this is not a delta..
            this.phase = delta;
        },

        sample: function (rate, duration) {
            return sampleSignal(this, rate, duration);
        },

        render: function (length, amp_ratio) {
            return renderSignal(this, length, amp_ratio);
        },

        draw: function () {
            drawCurve(this.context, 0, this.curve,
                    this.color, this.stroke_width);
        },
    };

    function AddButton(context, x, y, width, height, normalColor, hoverColor) {
        this.thickness = width / 4;
        Button.apply(this, arguments);
        return this;
    }

    AddButton.prototype = Object.create(Button.prototype, {
        /* -> void
         * takes a color, draws button on canvas, '+'
         */
        draw:  { // override inherited draw
            value: function () {
                var y1 = this.y + Math.floor(this.height / 2) -
                            Math.floor(this.thickness / 2);
                this.context.fillStyle = this.color;
                this.context.fillRect(this.x,
                    y1,
                    this.width,
                    this.thickness);
                var x1 = this.x + Math.floor(this.width / 2) -
                            Math.floor(this.thickness / 2);
                this.context.fillRect(x1,
                    this.y,
                    this.thickness,
                    this.height);
            },
        },

        press: {
            value: function (g) {
                var colorIndex = chooseColor(g.options.colors,
                        g.signals),
                color = g.options.colors[colorIndex],
                signal = new Signal(g.aContext,
                        g.context,
                        g.options.defaultSignal,
                        color,
                        g.options.stroke_width);
                g.add(signal);

                if (g.playing) {
                    signal.play(g.gain);
                }

                signal.sample(g.getRate(),
                        g.getDuration());
                signal.render();

                g.draw();
            },
        }
    });

    /* play button for controlling playback of sound and
     * movement of signals. on/off
     */
    function PlayButton(context, x, y, width,
                        height, normalColor, hoverColor) {
        this.playing = false;
        this.playID = 0;
        Button.apply(this, arguments);
        return this;
    }

    PlayButton.prototype = Object.create(Button.prototype, {
        draw: {
            value: function () {
                var ctx = this.context;

                if (!this.playing) {
                    ctx.fillStyle = this.color;
                    ctx.beginPath();

                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x, this.y + this.height);
                    ctx.lineTo(this.x + this.width,
                                this.y + (this.height / 2));
                    ctx.lineTo(this.x, this.y);

                    ctx.closePath();
                    ctx.fill();
                }
                else {
                    ctx.fillStyle = this.color;
                    ctx.beginPath();

                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x, this.y + this.height);
                    ctx.lineTo(this.x + this.width, this.y + this.height);
                    ctx.lineTo(this.x + this.width, this.y);

                    ctx.closePath();
                    ctx.fill();
                }
            },
        },

       press: {
           value: function (g, x, y) {
               if (!this.playing) {
                   this.playing = true;
               }
               else {
                   this.playing = false;
               }

               g.states.playing = this.playing;

               if (g.states.playing) {
                   g.drawUI();
                   this.playID = g.play(0);
               }
               else {
                   g.stop(this.playID);
                   g.draw();
               }
           },
       },
    });


    function Display(context, x, y, color) {
        return this.init(context, x, y, color);
    }

    Display.prototype = {
        init: function (context, x, y, color) {
            this.x = x;
            this.y = y;
            this.context = context;
            this.color = color;
            this.selected = -1;

            this.signals = [];
        },

        add: function (signal) {
            this.signals.push(signal);
        },

        remove: function (index) {
            this.signals.splice(index, 1);
        },

        draw: function () {
            var i = 0,
                n = this.signals.length;

            this.signals.map(function (signal) {
                var x = this.x + 70 * (i - n / 2) - 35,
                    y = this.y,
                    ctx = this.context,
                    f = Math.abs(signal.frequency),
                    w = (f < 100) ? 32 : 
                            (f < 1000) ? 41 : 49;
                
                // draw line
                ctx.beginPath();

                ctx.strokeStyle = signal.color;
                ctx.lineWidth = (this.selected == i) ? 3 : 1;
                ctx.moveTo(x, y);
                ctx.lineTo(x+w, y);
                ctx.closePath();

                ctx.stroke();

                // write frequency
                ctx.font = "11pt Helvetica";
                ctx.fillStyle = this.color;
                ctx.textBaseline = "bottom";
                ctx.fillText(f + "hz", x, y);

                i++;
            }, this);
        }
    }

    /* Graphesizer object takes care of the canvas:
     * drawing signals,
     * handling input,
     * updating samples
     */
    Graphesizer.prototype = {

        options: {
            buttonColor: "#657b83",
            buttonHoverColor: "#002b36",
            waveSumColor: "#eee8d5",

            /* signal of amplitude 1 goes 1/3 of the way from
             * x-axis to top of screen
             */
            amplitude_ratio:  1 / 3,
            stroke_width: 1,
            zoom_factor: 80,
            play_rate: 30, // fps

            drawExpression: true,
            selectThreshold: 60, // px of fuzziness on singal click-selection

            defaultSignal: 220,
            colors: ["#d33682", "#dc322f", "#b58900",
            "#6c71c4", "#268bd2", "#2aa198",
            "#859900", "#073642", "#657b83",
            "#93a1a1"],
        },

        states: {
            selectedSignal: -1,
            dragging: false,
            hovering: false,
            playing: false,
            dragXOrigin: 0
        },

        init: function (canvas) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");

            try {
                window.AudioContext = window.AudioContext ||
                                        window.webkitAudioContext;
                this.aContext = new AudioContext();
            }
            catch (e) {
                console.log(e);
            }

            canvas.height = window.innerHeight;
            canvas.width = window.innerWidth;

            this.width = canvas.width;
            this.height = canvas.height;

            this.states.zoom = this.width * this.options.zoom_factor;

            this.signals = [];
            this.audio = [];
            this.curve = [];
            this.buttons = [];

            this.buttons.push(new AddButton(this.context,
                                             30, 30, 40, 40,
                                             this.options.buttonColor,
                                             this.options.buttonHoverColor));
            this.buttons.push(new PlayButton(this.context,
                                             100, 30, 40, 40,
                                             this.options.buttonColor,
                                             this.options.buttonHoverColor));

            this.gain = this.aContext.createGain();
            this.gain.gain.value = 1;
            this.gain.connect(this.aContext.destination);

            this.display = new Display(this.context, this.width / 2,
                    this.height * 0.9, this.options.colors[7]);

            this.drawZoom();

            var self = this;

            canvas.addEventListener('mousemove', function (event) {
                self.update(event); 
            }, false);

            canvas.addEventListener('mousedown', function (event) {
                self.onmousedown(event); 
            }, false);

            canvas.addEventListener('mouseup', function (event) {
                self.onmouseup(event); 
            }, false);

            canvas.addEventListener('mousewheel', function (event) {
                self.onmousewheel(event); 
            }, false);
        },

        clear: function () {
            this.canvas.width = this.canvas.width;
        },

        /* general function that handles:
         * redraw,
         * buttons,
         * mouseovers,
         * all input
         */
        update: function (event) {
            var x = event.clientX,
                y = event.clientY;

            if (this.states.dragging) {
                var delta = (x - this.states.dragXOrigin);

                if (this.states.selectedSignal != -1) {
                    var signal = this.signals[this.states.selectedSignal];

                    // x - dephase
                    signal.dephase(signal.prev_phase 
                            + (delta / this.states.zoom)
                            * 2 * Math.PI * signal.frequency * -1);

                    // y - amplify
                    delta = (y - this.states.dragYOrigin);
                    signal.modulate(0, signal.prev_amplitude 
                            - 2 * delta 
                            / (this.height * this.options.amplitude_ratio) 
                            - signal.amplitude);

                    if (signal.amplitude <= 0) {
                        this.remove(this.states.selectedSignal);

                        this.select(-1);
                        this.states.dragging = false;
                    }
                    else {
                        signal.sample(this.getRate(),
                                this.getDuration());
                    }
                }

                this.draw();
            }
            else {
                this.updateUI(x, y);
            }
        },

        drawUI: function () {
            for (var i = 0; i < this.buttons.length; i++) {
                this.buttons[i].draw();
            }

            this.display.draw();
        },

        updateUI: function (x, y) {
            this.states.hovering = false;
            for (var i = 0; i < this.buttons.length; i++) {
                this.buttons[i].update(x, y);
                if (this.buttons[i].hovering) {
                    this.states.hovering = true;
                }
            }
        },

        select: function (index) {
            this.states.selectedSignal = index;
            this.display.selected = index;
            if (index != -1) {
                var signal = this.signals[index];
                signal.stroke_width = 3; // selected signal stroke_width
                signal.prev_phase = signal.phase;
                signal.prev_amplitude = signal.amplitude;
            }
        },

        resetSelection: function () {
            if (this.states.selectedSignal != -1) {
                this.signals[this.states.selectedSignal].stroke_width = this.options.stroke_width;
            }
        },

        beginDrag: function (x, y) {
            this.states.dragging = true;
            this.states.dragXOrigin = x;
            this.states.dragYOrigin = y;
            if (this.states.selectedSignal == -1) {
                this.states.prev_zoom = this.states.zoom;
            }
        },

        onmousedown: function (event) {
            var x = event.clientX,
                y = event.clientY;

            if (!this.states.hovering) {
                this.resetSelection();

                var closest = getClosest(x, y, this.signals, this.options.selectThreshold);

                this.select(closest);
                this.beginDrag(x, y);
                this.draw();
            }
        },

        onmouseup: function (event) {
            var x = event.clientX,
            y = event.clientY;

            if (!this.states.dragging) {
                for (var i = 0; i < this.buttons.length; i++) {
                    if (this.buttons[i].hovering) {
                        this.buttons[i].press(this, x, y);
                    }
                }
            }

            this.states.dragging = false;
        },

        onmousewheel: function (event) {
            event.preventDefault();
            var delta = event.wheelDeltaY;

            if (this.states.selectedSignal != -1) {
                var signal = this.signals[this.states.selectedSignal];

                signal.modulate(delta, 0);
                signal.sample(this.getRate(),
                        this.getDuration());
            }
            else {
                this.states.zoom += delta * this.options.zoom_factor;
                this.resample();
            }
            this.draw();
        },

        getRate: function () {
            return 1 / this.states.zoom;
        },

        getDuration: function () {
            return this.width / this.states.zoom;
        },

        add: function (signal) {
            this.signals.push(signal);
            this.display.add(signal);
        },

        remove: function (index) {
            this.signals.splice(this.states.selectedSignal, 1);
            this.display.remove(index);
        },

        /* generates a total wave expression from all signals,
         * based on their modes of interference
         */
        sample: function () {
            var sum = 0;
            this.audio = [];
            for (var i = 0; i < this.width; i++) {
                for (var j = 0; j < this.signals.length; j++) {
                    // only plus so far
                    sum += this.signals[j].audio[i];
                }
                this.audio.push(sum);
                sum = 0;
            }
        },

        /* dephases every signal in this.signals by delta
         * useful because playback/motion of waves can be seen as
         * a sequential dephasage (since we are bound to origo = o along x axis)
         *
         * a more efficient solution is to simply cycle the curves of all signals
         */
        dephase: function (delta) {

        }, 

        /* (re)sample every signal in this.signals
         * necessary when something is affecting all signals,
         * such as changing the zoom
         */
        resample: function (rate, duration) {
            for (var i = 0; i < this.signals.length; i++) {
                this.signals[i].sample(this.getRate(),
                        this.getDuration());
            }
        },

        render: function () {
            if (this.options.drawExpression) {
                return renderSignal(this, this.width, this.options.amplitude_ratio);
            }
        },

        drawExpression: function () {
            if (this.signals.length > 1) {
                drawCurve(this.context, 0, this.curve, this.options.waveSumColor, 4);
            }
        },

        draw: function () {
            this.clear();

            if (this.options.drawExpression) {
                this.sample();
                this.render();
                this.drawExpression();
            }

            for (var i = 0; i < this.signals.length; i++) {
                this.signals[i].render(this.width, this.options.amplitude_ratio);
                this.signals[i].draw();
            }

            this.drawUI();
            this.drawZoom();
        },

        drawZoom: function () {
            var ctx = this.context,
                margin = 20;

            ctx.textAlign = "right";
            ctx.font = "normal lighter 32pt Helvetica";
            ctx.textBaseline = "bottom";

            ctx.fillStyle = this.options.buttonColor;

            ctx.fillText((this.width / this.states.zoom).toFixed(3) + "s", this.width - margin, this.height - margin/2);
        },

        stop: function (id) {
            clearInterval(id);
            for (var i = 0; i < this.signals.length; i++) {
                this.signals[i].stop(0);
            }

            this.playing = false;
        },

        /* currently cycles already rendered curves for efficiency,
         * this isn't prefect/accurate beacuse they don't match/loop
         * over ends of screens
         *
         * a solution would be to sequentially dephase all frequencies
         */
        play: function () {
            var self = this,
               i = 0;

            for (i = 0; i < this.signals.length; i++) {
                this.signals[i].play(this.gain);
            }

            this.playing = true;

            return setInterval(function () { 
                self.clear();
                for (var s = 0; s < self.signals.length; s++) {
                    drawCurve(self.context,
                        Math.floor(i),
                        self.signals[s].curve,
                        self.signals[s].color,
                        self.options.stroke_width);
                }
                i += 1000 * self.options.play_rate * self.width / self.states.zoom;
                self.drawUI();
            },
            1000 / this.options.play_rate);
        }
    };
})(window, document);
