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
            drawCurve(this.context, 0, this.curve, this.color, this.stroke_width);
            return this;
        },
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

    /* play button for controlling playback of sound and
     * movement of signals. on/off
     */
    function PlayButton(context, x, y, width, height) {
        'use strict';
        return this.init(context, x, y, width, height);
    }

    PlayButton.prototype = {
        init: function (context, x, y, width, height) {
            this.context = context,
            this.x = x,
            this.y = y,
            this.width = width,
            this.height = height;

            this.fuzzy = 5;

            return this;
        },

        draw: function (color) {
            var ctx = this.context;

            ctx.fillStyle = color;
            ctx.beginPath();

            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y + (this.height / 2));
            ctx.lineTo(this.x, this.y);

            ctx.closePath();
            ctx.fill();

            return this;
        },

        /* same as for addbutton */
        hover: function (x, y) {
            return hover(x, y, this.x, this.y, this.width, this.height, this.fuzzy);
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

            /* signal of amplitude 1 goes 1/3 of the way from
             * x-axis to top of screen
             */
            amplitude_ratio:  1 / 3,
            stroke_width: 1,
            zoom_factor: 80,
            play_rate: 1,

            drawExpression: true,
            selectThreshold: 60, // px of fuzziness on singal click-selection

            defaultSignal: 220,
            colors: ["#d33682", "#dc322f", "#b58900",
                     "#6c71c4", "#268bd2", "#2aa198",
                     "#859900", "#073642", "#657b83",
                     "#93a1a1"]
        },

        states: {
            addButtonHover: false,
            playButtonHover: false,
            selectedSignal: -1,
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

            this.states.zoom = this.width * this.options.zoom_factor;

            this.signals = [];
            this.audio = [];
            this.curve = [];

            this.addButton = new AddButton(this.context, 30, 30, 40, 40, 10);
            this.addButton.draw(this.options.buttonColor);

            this.playButton = new PlayButton(this.context, 100, 30, 40, 40);
            this.playButton.draw(this.options.buttonColor);

            var self = this;
            canvas.addEventListener('mousemove', function (event) { self.update(event) }, false);
            canvas.addEventListener('mousedown', function (event) { self.onmousedown(event) }, false);
            canvas.addEventListener('mouseup', function (event) { self.onmouseup(event) }, false);
            canvas.addEventListener('mousewheel', function (event) { self.onmousewheel(event) }, false);
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

            if (this.addButton.hover(x, y)) {
                if (!this.states.addButtonHover) {
                    this.addButton.draw(this.options.buttonHoverColor);
                    this.states.addButtonHover = true;
                }
            }
            else {
                if (this.states.addButtonHover) {
                    this.addButton.draw(this.options.buttonColor);
                    this.states.addButtonHover = false;
                }
            }

            if (this.playButton.hover(x, y)) {
                if (!this.states.playButtonHover) {
                    this.playButton.draw(this.options.buttonHoverColor);
                    this.states.playButtonHover = true;
                }
            }
            else {
                if (this.states.playButtonHover) {
                    this.playButton.draw(this.options.buttonColor);
                    this.states.playButtonHover = false;
                }
            }

            if (this.states.dragging) {
                var delta = (x - this.states.dragXOrigin);

                if (this.states.selectedSignal != -1) {
                    var signal = this.signals[this.states.selectedSignal];

                    // x - dephase
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
                }
                else { // we are draggin canvas
                    this.states.zoom = this.states.prev_zoom + delta * this.options.zoom_factor;
                    this.resample();
                }

                this.draw();
            }

            return this;
        },

        onmousedown: function (event) {
            var x = event.clientX,
                y = event.clientY;

            if (!this.states.addButtonHover && !this.states.playButtonHover) {
                this.states.dragging = true;
                this.states.dragXOrigin = x;
                this.states.dragYOrigin = y;

                var previous_selection = this.states.selectedSignal;

                if (previous_selection != -1) {
                    this.signals[previous_selection].stroke_width = this.options.stroke_width;
                }

                var closest = getClosest(x, y, this.signals, this.options.selectThreshold);
                this.states.selectedSignal = closest;

                if (closest != -1) {
                    var signal = this.signals[closest];
                    signal.stroke_width = 3; // selected signal stroke width
                    signal.prev_phase = signal.phase;
                    signal.prev_amplitude = signal.amplitude;
                }
                else {
                    this.states.prev_zoom = this.states.zoom;
                }

                this.draw();
            }

            return this;
        },

        onmouseup: function (event) {
            var x = event.clientX,
                y = event.clientY;

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

                    this.draw();
                }
            }

            this.states.dragging = false;
        },

        onmousewheel: function (event) {
            event.preventDefault();

            if (this.states.selectedSignal != -1) {
            var delta = event.wheelDeltaY,
                signal = this.signals[this.states.selectedSignal];

            signal.frequency += delta;
            signal.sample(1 / this.states.zoom,
                          this.width / this.states.zoom);

            this.draw();
            }
        },

        add: function (signal) {
            this.signals.push(signal);

            return this;
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

            return this;
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
                this.signals[i].sample(1 / this.states.zoom,
                                       this.width / this.states.zoom);
            }
            
            return this;
        },

        render: function () {
            if (this.options.drawExpression) {
                return renderSignal(this, this.width, this.options.amplitude_ratio);
            }
        },

        drawExpression: function () {
            if (this.signals.length > 1) {
                drawCurve(this.context, 0, this.curve, this.options.colors[7], 4); // 4 is stroke width, 7 is a good color
            }
            return this;
        },

        draw: function () {
            this.clear();

            if (this.options.drawExpression) {
                this.sample()
                    .render()
                    .drawExpression();
            }

            for (var i = 0; i < this.signals.length; i++) {
                this.signals[i].render(this.width, this.options.amplitude_ratio)
                    .draw();
            }
            
            if (this.states.addButtonHover) {
                this.addButton.draw(this.options.buttonHoverColor);
            }
            else {
                this.addButton.draw(this.options.buttonColor);
            }

            if (this.states.playButtonHover) {
                this.playButton.draw(this.options.buttonHoverColor);
            }
            else {
                this.playButton.draw(this.options.buttonColor);
            }
        },

        /* currently cycles already rendered curves for efficiency,
         * this isn't prefect/accurate beacuse they don't match/loop
         * over ends of screens
         *
         * a solution would be to sequentially dephase all frequencies
         */
        play: function () {
            var i = 0,
                self = this;
            setInterval(function() { 
                self.clear();
                for (var s = 0; s < self.signals.length; s++) {
                    drawCurve(self.context,
                        i,
                        self.signals[s].curve,
                        self.signals[s].color,
                        self.options.stroke_width);
                }
                // TODO fix this shit because it isn't working correctly
                i += (self.width / self.states.zoom) * self.options.play_rate;
            },
            1 / self.options.play_rate);
        }
    }
})(window, document);
