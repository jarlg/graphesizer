"use strict"

math = require('mathjs')()
Signal = require './Signal.coffee'

class App
    constructor: (@canvas, @samplerate) ->
        @currentSignal = null
        @signalHistory = []
        @signalColors = []

        @audioCtx = new webkitAudioContext()

        @canvas.addEventListener 'mousedown',  (event) => @mousedownHandler event
        @canvas.addEventListener 'mouseup',    (event) => @mouseupHandler event
        @canvas.addEventListener 'mousewheel', (event) => @scrollHandler event
        @canvas.addEventListener 'dblclick',   (event) => @dblclickHandler event
        @canvas.addEventListener 'mousemove',  (event) => @mousemoveHandler event

        @initGain()

    initGain: ->
        @gain = @audioCtx.createGain()
        @gain.gain.value = 0.5
        @gain.connect @audioCtx.destination
        @

    setLineWidth: (lineWidth) ->
        @ctx.lineWidth = lineWidth
        @

    setSignalColors: (@signalColors) -> @
    fromX: -> @secondsToGraphX(@currentSignal.window.from)
    toX: -> @secondsToGraphX(@currentSignal.window.to)
        
    # we choose next color by cycling through @signalColors, using
    # index = (number of signals) % (number of colors)
    nextColor: ->
        nSignals = if @sidebar? then @sidebar.signals.length else @signalHistory.length
        @signalColors[nSignals % @signalColors.length]

    add: (signal) ->
        signal.color = @nextColor()
        @draw signal
        @currentSignal.stop() if @currentSignal?
        @currentSignal = signal

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
                @startDrag event
            else
                if Math.abs(@fromX() - event.x) < Math.abs(@toX() - event.x)
                    [@currentSignal.window.to, @currentSignal.window.from] = [@currentSignal.window.from, @currentSignal.window.to]
        @

    mouseupHandler: (event) ->
        if @currentSignal?
            if @dragging
                @dragging = false
                if @currentSignal.window.to != @currentSignal.window.from
                    if @sidebar?
                        if @sidebar.signals.length == 0 or @sidebar.signals[@sidebar.signals.length-1] != @currentSignal
                            @sidebar.add @currentSignal
                    else if @signalHistory.length == 0 or @signalHistory[@signalHistory.length-1] != @currentSignal
                        @signalHistory.push @currentSignal
                @endDrag event
            @currentSignal.play @audioCtx, @gain
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
        @currentSignal.startWindowSelection @graphXToSeconds(event.x)
        @draw()

    endDrag: (event) ->
        @currentSignal.endWindowSelection @graphXToSeconds(event.x)
        @draw()

    mousemoveHandler: (event) ->
        if @currentSignal? 
            if @dragging
                @endDrag(event)
            if @nearSelectionEdge(event.x)
                if not @currentSignal.window.focused
                    @currentSignal.window.focused = true
                    if Math.abs(@toX() - event.x) < Math.abs(@fromX() - event.x)
                        @drawSelectionEdge @toX(), @selectionEdgeFocusColor
                    else
                        @drawSelectionEdge @fromX(), @selectionEdgeFocusColor
            else if @currentSignal.window.focused
                @currentSignal.window.focused = false
                @draw()
        @

    bindInput: (@input) ->
        @input.addEventListener 'keyup', (event) => 
            if @input.value() != '' and @input.value() != null
                if not @currentSignal? or @currentSignal.fn != @input.value()
                    try @add new Signal(@input.value(), @samplerate)
                    catch e
        @


module.exports = App
