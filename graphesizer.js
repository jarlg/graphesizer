function Graphesizer(canvas) {
    'use strict';
    return this.init(canvas);
}

(function (window, document) {
    'use strict';

    /* -> bool
     * takes two points, a margin and a size (symmtry) a fuzziness
     * returns if the two points are within the object
     */
    function hover(x, y, margin, size, fuzzy) {
        if ((x > margin - fuzzy && x < margin + fuzzy + size) &&
            (y > margin - fuzzy && y < margin + fuzzy + size)) {
                return true;
            }
        return false;
    }

    function Signal(context, frequency, color) {
        'use strict';
        return this.init(context, frequency, color);
    }

    Signal.prototype = {
        init: function (context, frequency, color) {
            this.context = context;
            this.frequency = frequency;
            this.color = color;
            this.phase = 0;
            this.prev_phase = 0;
        },

        // -> [Amplitude]
        sample: function (rate, duration) {
            /*
             * TODO: forget to clear canvas makes for interesting effects
             */
            this.data = [];
            for (var x = 0; x < duration; x += rate) {
                this.data.push(Math.sin(2 * Math.PI * this.frequency * x + this.phase));
            }

            return this;
        },


        /* -> void 
         * takes a context, signal :: [Amplitude], 
         * number of elements to draw and color
         */
        draw: function (length) {
            var context = this.context;
            var origo = context.canvas.height / 2;
            var amp_ratio = origo * 1 / 3;

            context.beginPath();
            context.strokeStyle = this.color;
            context.moveTo(0, origo);
            for (var i = 1; i < length; i++) {
                context.lineTo(i, origo + (this.data[i] * amp_ratio));
                context.moveTo(i, origo + (this.data[i] * amp_ratio));
            }
            context.stroke();

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
            return hover(x, y, this.x, this.width, this.fuzzy);
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
            this.addButton = new AddButton(this.context, 30, 30, 40, 40, 10);
            this.addButton.draw(this.options.addButtonColor);

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
                var delta = (x - this.states.dragXOrigin);
                signal.phase = signal.prev_phase + (delta / this.states.zoom) * 2 * Math.PI * signal.frequency * -1;
                signal.sample(1 / this.states.zoom, // rate
                        this.width / this.states.zoom); //duration
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
                var signal = this.signals[this.states.selectedSignal];
                signal.prev_phase = signal.phase;
            }

            return this;
        },

        onmouseup: function (pos) {
            var x = pos.clientX,
                y = pos.clientY;

            if (!this.states.dragging) {
                if (this.states.addButtonHover) {
                    var index = this.signals.length;
                    var color = this.options.colors[index % this.options.colors.length];
                    var signal = new Signal(this.context,
                                        this.options.defaultSignal,
                                        color);
                    this.add(signal);

                    signal.sample(1 / this.states.zoom, //rate
                                  this.width / this.states.zoom);

                    signal.draw(this.width);
                }
            }

            this.states.dragging = false;
        },

        add: function (signal) {
            this.signals.push(signal);

            return this;
        },

        draw: function () {
            this.clear();

            for (var i = 0; i < this.signals.length; i++) {
                this.signals[i].draw(this.width);
            }

            this.addButton.draw(this.options.addButtonColor);
        }
    }
})(window, document);