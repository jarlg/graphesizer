"use strict"

math = require('mathjs')()

class App
    constructor: (@canvas, @samplerate) ->
        @canvas.height = window.innerHeight
        @canvas.width = window.innerWidth
        @signalHistory = []
        @currentSignal = null
        @signalColors = []
        @dragging = false

        @zoom = 1 # s onscreen
        @yZoom = 160 # = height in px corresponding to amplitude 1 in signal
        @origoX = window.innerWidth / 2
        @origoY = window.innerHeight / 2

        @audioCtx = new webkitAudioContext()
        @ctx = canvas.getContext("2d")

        @canvas.addEventListener('mousedown',  ( (event) => @mousedownHandler(event) ))
        @canvas.addEventListener('mouseup',    ( (event) => @mouseupHandler(event) ))
        @canvas.addEventListener('mousewheel', ( (event) => @scrollHandler(event) ))

        @initGain()

    initGain: () ->
        @gain = @audioCtx.createGain()
        @gain.gain.value = 0.5
        @gain.connect(@audioCtx.destination)
        @

    setLineWidth: (lineWidth) ->
        @ctx.lineWidth = lineWidth
        @

    setSignalColors: (@signalColors) ->
        @
        
    # we choose next color by cycling through @signalColors, using
    # index = (number of signals) % (number of colors)
    nextColor: () ->
        nSignals = if @sidebar? then @sidebar.signals.length else @signalHistory.length
        @signalColors[nSignals % @signalColors.length]

    add: (signal) ->
        if @sidebar?
            @sidebar.add(signal)
        else
            @signalHistory.push(signal)
        signal.color = @nextColor()
        @currentSignal.stop() if @currentSignal?
        @currentSignal = signal
        @draw()
        

    draw: () ->
        @clear()
        expr = math.parse(@currentSignal.fn).compile(math)
        delta = @zoom / @canvas.width
        scope = { x: @graphXToSeconds(0) }
        @ctx.moveTo(0, expr.eval(scope))
        @ctx.beginPath()
        @ctx.strokeStyle = @currentSignal.color
        for i in [1 .. @ctx.canvas.width-1]
            do (i) => 
                scope.x += delta
                @ctx.lineTo(i, @yZoom * expr.eval(scope) + @origoY)
        @ctx.stroke()
        @ctx.closePath()
        @drawSelection()

    drawSelection: () ->
        from = @currentSignal.window.from
        to = @currentSignal.window.to
        if to != from or @dragging
            @ctx.fillStyle = "rgba(238, 232, 213, 0.5)"
            @ctx.fillRect( @secondsToGraphX(from)
                         , 0
                         , @secondsToGraphX(to) - @secondsToGraphX(from)
                         , window.innerHeight)
            @ctx.beginPath()
            @ctx.strokeStyle = "#93a1a1"
            @ctx.moveTo(@secondsToGraphX(from), 0)
            @ctx.lineTo(@secondsToGraphX(from), window.innerHeight)
            @ctx.moveTo(@secondsToGraphX(to)  , 0)
            @ctx.lineTo(@secondsToGraphX(to)  , window.innerHeight)
            @ctx.stroke()
            @ctx.closePath()
            @drawSelectionIndicators()
        @

    drawSelectionIndicators: () ->
        @ctx.font = "20pt Georgia"
        @ctx.fillStyle = "#586e75"
        if @currentSignal.window.from < @currentSignal.window.to
            offset1 = -95
            offset2 = 20
        else
            offset1 = 20
            offset2 = -95
        @ctx.fillText( @currentSignal.window.from.toFixed(2) + 's'
                     , @secondsToGraphX(@currentSignal.window.from) + offset1
                     , 30)
        @ctx.fillText( @currentSignal.window.to.toFixed(2) + 's'
                     , @secondsToGraphX(@currentSignal.window.to) + offset2
                     , 30)

    secondsToGraphX: (s) ->
        ((s * @canvas.width) / @zoom) + @origoX

    graphXToSeconds: (x) ->
        (x - @origoX) * @zoom / @canvas.width

    mousedownHandler: (event) ->
        if @currentSignal?
            @dragging = true
            @startDrag(event)
        @

    mouseupHandler: (event) ->
        if @dragging
            @dragging = false
            @canvas.onmousemove = null
            @endDrag(event)
        @currentSignal.play(@audioCtx, @gain)
        @

    scrollHandler: (event) ->
        event.preventDefault()
        @zoom += event.deltaY
        @draw()

    startDrag: (event) ->
        @currentSignal.startWindowSelection(@graphXToSeconds(event.x))
        @canvas.onmousemove = ((event) => @endDrag(event))
        @draw()

    endDrag: (event) ->
        @currentSignal.endWindowSelection(@graphXToSeconds(event.x))
        @draw()

    clear: () ->
        @canvas.height = @canvas.height


module.exports = App
