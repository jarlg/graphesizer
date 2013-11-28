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
            signal.audio.push(signal.amplitude * Math.sin(2 * Math.PI * signal.frequency * x + signal.phase));
        }

        return signal;
    }

    /* creates a curve based on already sampled audio
     */
    function renderSignal(signal, length, amp_ratio) {
        var origo = signal.context.canvas.height / 2;
        signal.curve = [];
        for (var x = 0; x < length; ++x) {
            signal.curve.push(origo + signal.audio[x] * origo * amp_ratio);
        }
        return signal;
    }

    function drawCurve(context, curve, color, stroke_width) {
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = stroke_width;
        context.moveTo(0, curve[0]);

        var y;
        for (var i = 1; i < curve.length; i++) {
            y = curve[i];
            context.lineTo(i, y);
            context.moveTo(i, y);
        }
        context.stroke();
    }

    /* -> float distance
     * returns distance between two points
     * using simple pythagoras d = sqrt(abs(x2-x1)**2 + abs(y2-y1)**2)
     */
    function getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(Math.abs(x2 - x1), 2) + Math.pow(Math.abs(y2 - y1), 2));
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
        console.log('error in calculation of signal\'s direction in x = ' + x);
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
    function getClosest(x, y, signals) {
        var distance = 100, // magic number
            index = 0,
            tmp = 0;

        for (var i = 0; i < signals.length; i++) {
            tmp = distanceToCurve(x, y, signals[i]);
            if (tmp < distance) {
                distance = tmp;
                index = i;
            }
        }

        return index;
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


    function Signal(context, frequency, color, stroke_width) {
        'use strict';
        return this.init(context, frequency, color, stroke_width);
    }


    Signal.prototype = {
        init: function (context, frequency, color, stroke_width) {
            this.context = context;
            this.frequency = frequency;
            this.color = color;
            this.stroke_width = stroke_width;
            this.phase = 0;
            this.mode = '+'; // possible modes: +, -, / and *
            this.prev_phase = 0;
            this.amplitude = 1;
            this.prev_amplitude = 0;
        },

        sample: function (rate, duration) {
            return sampleSignal(this, rate, duration);
        },

        render: function (length, amp_ratio) {
            return renderSignal(this, length, amp_ratio);
        },

        draw: function () {
            drawCurve(this.context, this.curve, this.color, this.stroke_width);
            return this;
        }
    }


    function AddButton(context, x, y, width, height, thickness) {
        'use strict';
        return this.init(context, x, y, width, height, thickness);
    }

    AddButton.prototype = {
        init: function (context, x, y, width, height, thickness) {
            this.context = context;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.thickness = thickness;

            this.fuzzy = 5;

            return this;
        },

        /* -> void
         * takes a color, draws button on canvas, '+'
         */
        draw: function (color) {
            var y1 = this.y + Math.floor(this.height / 2) - Math.floor(this.thickness / 2);
            this.context.fillStyle = color;
            this.context.fillRect(this.x,
                    y1,
                    this.width,
                    this.thickness);
            var x1 = this.x + Math.floor(this.width / 2) - Math.floor(this.thickness / 2);
            this.context.fillRect(x1,
                    this.y,
                    this.thickness,
                    this.height);

            return this;
        },

        /* -> bool
         * checks if two coordinates are over the button
         */
        hover: function (x, y) {
            return hover(x, y, this.x, this.x, this.width, this.height, this.fuzzy);
        }
    }


    /* wave expression on bottom of screen
     * can modify frequencies of waves,
     * modify "mode" as in [add/multiply/divide]
     */
    function WaveExpression(context, x, y, fontsize, spacing) {
        'use strict';
        return this.init(context, x, y, fontsize, spacing);
    }

    WaveExpression.prototype = {
        init: function (context, x, y, fontsize, spacing, stroke_width) {
            this.signals = [];
            this.stroke_width = stroke_width;
        },

        add: function (signal) {
            this.signals.push(signal);
        }
    }


    /* Graphesizer object takes care of the canvas:
     * drawing signals,
     * handling input,
     * updating samples
     */
    Graphesizer.prototype = {

        options: {
            addButtonColor: "#657b83",
            addButtonHoverColor: "#002b36",

            /* signal of amplitude 1 goes 1/3 of the way from
             * x-axis to top of screen
             */
            amplitude_ratio:  1 / 3,
            stroke_width: 1,

            defaultSignal: 220,
            colors: ["#d33682", "#dc322f", "#b58900",
                     "#6c71c4", "#268bd2", "#2aa198",
                     "#859900", "#073642", "#657b83",
                     "#93a1a1"]
        },

        states: {
            addButtonHover: false,
            selectedSignal: 0,
            dragging: false,
            dragXOrigin: 0

        },

        init: function (canvas) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");

            canvas.height = window.innerHeight;
            canvas.width = window.innerWidth;

            this.width = canvas.width;
            this.height = canvas.height;

            this.states.zoom = this.width * 80; // 80 is aesthetically pleasing on chromebook

            this.signals = [];
            this.audio = [];
            this.curve = [];

            this.addButton = new AddButton(this.context, 30, 30, 40, 40, 10);
            this.addButton.draw(this.options.addButtonColor);

            this.waveExpression = new WaveExpression(this.context, 0,0,0,0);

            var self = this;
            canvas.addEventListener('mousemove', function (pos) { self.update(pos) }, false);
            canvas.addEventListener('mousedown', function (pos) { self.onmousedown(pos) }, false);
            canvas.addEventListener('mouseup', function (pos) { self.onmouseup(pos) }, false);
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
        update: function (pos) {
            var x = pos.clientX,
            y = pos.clientY;

            if (this.addButton.hover(x, y)) {
                if (!this.states.addButtonHover) {
                    this.addButton.draw(this.options.addButtonHoverColor);
                    this.states.addButtonHover = true;
                }
            }
            else {
                if (this.states.addButtonHover) {
                    this.addButton.draw(this.options.addButtonColor);
                    this.states.addButtonHover = false;
                }
            }

            if (this.states.dragging) {
                var signal = this.signals[this.states.selectedSignal];

                // x - dephase
                var delta = (x - this.states.dragXOrigin);
                signal.phase = signal.prev_phase + (delta / this.states.zoom) * 2 * Math.PI * signal.frequency * -1;

                // y - amplify
                delta = (y - this.states.dragYOrigin);
                signal.amplitude = signal.prev_amplitude - 2 * delta / (this.height * this.options.amplitude_ratio);

                if (signal.amplitude <= 0) {
                    this.signals.splice(this.states.selectedSignal, 1);
                    this.states.selectedSignal = -1;
                }

                // sample
                signal.sample(1 / this.states.zoom, // rate
                        this.width / this.states.zoom); //duration

                this.sample();
                this.draw();
            }

            return this;
        },

        onmousedown: function (pos) {
            var x = pos.clientX,
                y = pos.clientY;

            if (!this.states.addButtonHover) {
                this.states.dragging = true;
                this.states.dragXOrigin = x;
                this.states.dragYOrigin = y;

                this.states.selectedSignal = getClosest(x, y, this.signals);
                
                var signal = this.signals[this.states.selectedSignal];
                signal.prev_phase = signal.phase;
                signal.prev_amplitude = signal.amplitude;
            }

            return this;
        },

        onmouseup: function (pos) {
            var x = pos.clientX,
                y = pos.clientY;

            if (!this.states.dragging) {
                if (this.states.addButtonHover) {
                    var colorIndex = chooseColor(this.options.colors,
                                                 this.signals);
                    var color = this.options.colors[colorIndex];

                    var signal = new Signal(this.context,
                                        this.options.defaultSignal,
                                        color,
                                        this.options.stroke_width);
                    this.add(signal);

                    signal.sample(1 / this.states.zoom, //rate
                                  this.width / this.states.zoom)
                        .render();

                    this.sample()
                        .render();

                    this.draw();
                }
            }

            this.states.dragging = false;
        },

        add: function (signal) {
            this.signals.push(signal);
            this.waveExpression.add(signal);

            return this;
        },

        /* generates a total wave expression from all signals,
         * based on their modes of interference
         */
        sample: function () {
            var sum = 0;
            this.audio = [];
            console.log(this.signals.length);
            for (var i = 0; i < this.width; i++) {
                for (var j = 0; j < this.signals.length; j++) {
                    // only plus so far
                    sum += this.signals[j].audio[i];
                }
                this.audio.push(sum);
                sum = 0;
            }

            return this;
        },

        render: function () {
            return renderSignal(this, this.width, this.options.amplitude_ratio);
        },

        drawExpression: function () {
            drawCurve(this.context, this.curve, this.options.colors[7], 4); // 5 is stroke width, 8 is a good color
            return this;
        },

        draw: function () {
            this.clear();

            this.render()
                .drawExpression();

            for (var i = 0; i < this.signals.length; i++) {
                this.signals[i].render(this.width, this.options.amplitude_ratio)
                    .draw();
            }
            this.addButton.draw(this.options.addButtonColor);
        },
    }
})(window, document);
