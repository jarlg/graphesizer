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
        @canvas.addEventListener('keydown',    ( (event) => @keydownHandler(event) ))
        @canvas.addEventListener('dblclick',   ( (event) => @dblclickHandler(event) ))
        @canvas.addEventListener('mousemove',  ( (event) => @mousemoveHandler(event) ))

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
        @drawOrigoIndicator()
        @drawSelection()
        @drawEdgeIndicator()

    drawOrigoIndicator: () ->
        @ctx.beginPath()
        @ctx.strokeStyle = "#93a1a1"
        @ctx.moveTo(@origoX, 0)
        @ctx.lineTo(@origoX, 25)
        @ctx.stroke()
        @ctx.closePath()
        @

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
        leftOffset = -95
        rightOffset = 20
        if @sidebar?
            lMargin = if @sidebar.hidden then 150 else 350
        else
            lMargin = 100
        rMargin = 100
        fromX = @secondsToGraphX(@currentSignal.window.from)
        toX   = @secondsToGraphX(@currentSignal.window.to)
        if @currentSignal.window.from < @currentSignal.window.to
            # if close to sides of screen draw inside selection
            fromX += if fromX > lMargin then leftOffset else rightOffset
            toX   += if window.innerWidth - toX > rMargin then rightOffset else leftOffset
            if toX - fromX < 80 then toY = 60 else toY = 30
            fromY = 30
        else # reverse roles
            fromX += if window.innerWidth - fromX > rMargin then rightOffset else leftOffset
            toX += if toX > lMargin then leftOffset else rightOffset
            if fromX - toX < 80 then fromY = 60 else fromY = 30
            toY = 30
        @ctx.fillText( @currentSignal.window.from.toFixed(2) + 's'
                     , fromX
                     , fromY)
        @ctx.fillText( @currentSignal.window.to.toFixed(2) + 's'
                     , toX
                     , toY)
        @

    drawEdgeIndicator: () ->
        @ctx.font = "20pt Georgia"
        @ctx.fillStyle = "#586e75"
        @ctx.fillText( @graphXToSeconds(window.innerWidth).toFixed(1) + 's'
                     , window.innerWidth - 80
                     , window.innerHeight - 20)
        @

    secondsToGraphX: (s) ->
        ((s * @canvas.width) / @zoom) + @origoX

    graphXToSeconds: (x) ->
        (x - @origoX) * @zoom / @canvas.width

    keydownHandler: (event) ->
        if @currentSignal? and event.keyCode == 32 #spacebar
            if Math.abs(@currentSignal.window.from) < Math.abs(@currentSignal.window.to)
                @zoomFitToEdge(@currentSignal.window.to)
            else
                @zoomFitToEdge(@currentSignal.window.from)
            @draw()
        @

    zoomFitToEdge: (s) ->
        @zoom = s * @canvas.width
        if s > 0
            @zoom /= (window.innerWidth - @origoX)
        else if s < 0
            if @sidebar?
                if @sidebar.hidden
                    @zoom /= (@sidebar.hiddenWidth - @origoX)
                else
                    @zoom /= (@sidebar.width - @origoX)
            else
                @zoom /= -@origoX
        @

    dblclickHandler: (event) ->
        event.preventDefault()
        @origoX = event.x
        @dragging = false
        @draw()

    mousedownHandler: (event) ->
        event.preventDefault()
        @origoX = event.x
        if @currentSignal?
            @dragging = true
            @startDrag(event)
        @

    mouseupHandler: (event) ->
        if @currentSignal?
            if @dragging
                @dragging = false
                @endDrag(event)
            @currentSignal.play(@audioCtx, @gain)
        @

    scrollHandler: (event) ->
        event.preventDefault()
        if @zoom > 10
            @zoom += event.deltaY
        else if @zoom > 1
            @zoom += event.deltaY / 10
        else if @zoom >= 0
            @zoom += event.deltaY / 100
        else
            @zoom = 0
        @draw()

    startDrag: (event) ->
        @currentSignal.startWindowSelection(@graphXToSeconds(event.x))
        @draw()

    endDrag: (event) ->
        @currentSignal.endWindowSelection(@graphXToSeconds(event.x))
        @draw()

    mousemoveHandler: (event) ->
        if @dragging
            @endDrag(event)

    clear: () ->
        @canvas.height = @canvas.height


module.exports = App
