"use strict"

math = require('mathjs')()
Signal = require('./Signal.coffee')

class App
    constructor: (@canvas, @samplerate) ->
        @canvas.height = window.innerHeight
        @canvas.width = window.innerWidth
        @signalHistory = []
        @currentSignal = null
        @signalColors = []
        @selectionEdgeColor = "#93a1a1"
        @selectionEdgeFocusColor = "#586e75"
        @hoverMargin = 20

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

    setSignalColors: (@signalColors) -> @
    fromX: () -> @secondsToGraphX(@currentSignal.window.from)
    toX: () -> @secondsToGraphX(@currentSignal.window.to)
        
    # we choose next color by cycling through @signalColors, using
    # index = (number of signals) % (number of colors)
    nextColor: () ->
        nSignals = if @sidebar? then @sidebar.signals.length else @signalHistory.length
        @signalColors[nSignals % @signalColors.length]

    add: (signal) ->
        signal.color = @nextColor()
        @draw(signal)
        @currentSignal.stop() if @currentSignal?
        @currentSignal = signal

    draw: (signal=@currentSignal) ->
        @clear()
        expr = math.parse(signal.fn).compile(math)
        delta = @zoom / @canvas.width
        scope = { x: @graphXToSeconds(0) }
        @ctx.moveTo(0, expr.eval(scope))
        @ctx.beginPath()
        @ctx.strokeStyle = signal.color
        for i in [1 .. @ctx.canvas.width-1]
            do (i) => 
                scope.x += delta
                @ctx.lineTo(i, @yZoom * expr.eval(scope) + @origoY)
        @ctx.stroke()
        @ctx.closePath()
        @drawOrigoIndicator()
        @drawEdgeIndicator()
        @drawSelection(signal)

    drawOrigoIndicator: () ->
        @ctx.beginPath()
        @ctx.strokeStyle = "#93a1a1"
        @ctx.moveTo(@origoX, 0)
        @ctx.lineTo(@origoX, 25)
        @ctx.stroke()
        @ctx.closePath()
        @

    drawSelection: (signal) ->
        from = signal.window.from
        to = signal.window.to
        if to != from or @dragging
            @ctx.fillStyle = "rgba(238, 232, 213, 0.5)"
            @ctx.fillRect( @secondsToGraphX(from)
                         , 0
                         , @secondsToGraphX(to) - @secondsToGraphX(from)
                         , window.innerHeight)
            @drawSelectionIndicators(signal)
            @drawSelectionEdge(@secondsToGraphX(from), @selectionEdgeColor)
            if @dragging or signal.window.focused
                @drawSelectionEdge(@secondsToGraphX(to), @selectionEdgeFocusColor)
            else
                @drawSelectionEdge(@secondsToGraphX(to), @selectionEdgeColor)
        @

    drawSelectionEdge: (x, color) ->
            @ctx.beginPath()
            @ctx.strokeStyle = color
            @ctx.moveTo(x, 0)
            @ctx.lineTo(x, window.innerHeight)
            @ctx.stroke()
            @ctx.closePath()
            @

    drawSelectionIndicators: (signal) ->
        @ctx.font = "20pt Georgia"
        @ctx.fillStyle = "#586e75"
        leftOffset = -95
        rightOffset = 20
        if @sidebar?
            lMargin = if @sidebar.hidden then 150 else 350
        else
            lMargin = 100
        rMargin = 100
        fromX = @fromX()
        toX   = @toX()
        if signal.window.from < signal.window.to
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
        @ctx.fillText( signal.window.from.toFixed(2) + 's'
                     , fromX
                     , fromY)
        @ctx.fillText( signal.window.to.toFixed(2) + 's'
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

    dblclickHandler: (event) ->
        event.preventDefault()
        if @currentSignal?
            @origoX = event.x
            @dragging = false
            @draw()
        @

    mousedownHandler: (event) ->
        event.preventDefault()
        if @currentSignal?
            @dragging = true
            if not @currentSignal.window.focused
                @startDrag(event)
                if @sidebar? and @sidebar.signals[-1] != @currentSignal
                    @sidebar.add(@currentSignal)
                else if @signalHistory[-1] != @currentSignal
                    @signalHistory.push(@currentSignal)
            else
                if Math.abs(@fromX() - event.x) < Math.abs(@toX() - event.x)
                    tmpTo = @currentSignal.window.to
                    @currentSignal.window.to = @currentSignal.window.from
                    @currentSignal.window.from = tmpTo
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
        if @zoom < 0
            @zoom = 0
        @draw()

    startDrag: (event) ->
        @currentSignal.startWindowSelection(@graphXToSeconds(event.x))
        @draw()

    endDrag: (event) ->
        @currentSignal.endWindowSelection(@graphXToSeconds(event.x))
        @draw()

    mousemoveHandler: (event) ->
        if @currentSignal? 
            if @dragging
                @endDrag(event)
            if @nearSelectionEdge(event.x)
                if not @currentSignal.window.focused
                    @currentSignal.window.focused = true
                    if Math.abs(@toX() - event.x) < Math.abs(@fromX() - event.x)
                        @drawSelectionEdge(@toX(), @selectionEdgeFocusColor)
                    else
                        @drawSelectionEdge(@fromX(), @selectionEdgeFocusColor)
            else if @currentSignal.window.focused
                @currentSignal.window.focused = false
                @draw()
        @

    nearSelectionEdge: (x) ->
        if @currentSignal.window.to != @currentSignal.window.from
            if Math.abs(@toX() - x) < @hoverMargin or Math.abs(@fromX() - x) < @hoverMargin
                return true
        false

    bindInput: (@input) ->
        @input.addEventListener('keyup', ( (event) => 
            if not @currentSignal? or @currentSignal.fn != @input.value()
                try @add(new Signal(@input.value(), @samplerate))
                catch e
        ))
        @

    clear: () ->
        @canvas.height = @canvas.height
        @


module.exports = App
