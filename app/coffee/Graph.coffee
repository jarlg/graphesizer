'use strict'

math = require('mathjs')()

#view of signal model
class Graph
    constructor: (@canvas, @app) ->
        @canvas.height = window.innerHeight
        @canvas.width = window.innerWidth
        @ctx = @canvas.getContext "2d"

        @origoX = window.innerWidth / 2
        @origoY = window.innerHeight / 2

        @dragging  = false
        @activeSelectionEdges = to: false, from: false

        @zoom  = 1 # s onscreen
        @zoomY = 180 # height in px corresponding to amp 1 in signal

    options:
        hoverMargin: 20,
        selectionEdgeColor: "#93a1a1",
        selectionEdgeFocusColor: "#586e75",
        selectionFillColor: "rgba(238, 232, 213, 0.5)"

    secondsToX: (s) -> (s * @canvas.width / @zoom) + @origoX
    xToSeconds: (x) -> (x - @origoX) * @zoom / @canvas.width
    hovering: (edgeX, x) -> Math.abs(edgeX - x) < @options.hoverMargin
    clear: -> @canvas.width = @canvas.width

    updateActive: (obj) ->
        redraw = false
        for own key, val of obj
            do =>
                if @activeSelectionEdges[key] != val
                    @activeSelectionEdges[key] = val
                    redraw = true
        if redraw
            @draw @app.signal

    update: (signal) -> 
        if @dragging
            @updateActive to: true, from: false
        @draw signal

    draw: (signal) -> 
        @clear()
        toX   = @secondsToX signal.window.to
        fromX = @secondsToX signal.window.from
        @drawSignal signal
        @drawTotalSecondsOnScreen @xToSeconds(window.innerWidth + @origoX)
        @drawOrigoIndicator()
        @drawSelection toX, fromX
        if @dragging or fromX != toX
            @drawSelectionText not @app.sidebar.hidden,
                               signal.window.from,
                               signal.window.to,
                               fromX,
                               toX
        if @dragging
            @drawSelectionEdge fromX, false
            @drawSelectionEdge toX, true
        else if fromX != toX
            @drawSelectionEdge fromX, @activeSelectionEdges.from
            @drawSelectionEdge toX, @activeSelectionEdges.to
        @

    drawSignal: (signal) ->
        expr = math.parse(signal.fn).compile(math)
        delta = @zoom / @canvas.width
        scope =  x: @xToSeconds 0
        @ctx.moveTo 0, expr.eval scope
        @ctx.beginPath()
        @ctx.strokeStyle = @app.nextColor()
        for i in [1 .. @canvas.width-1]
            do => 
                scope.x += delta
                @ctx.lineTo i, @zoomY * expr.eval(scope) + @origoY
        @ctx.stroke()
        @ctx.closePath()
        @

    drawTotalSecondsOnScreen: (seconds) ->
        @ctx.font = "20pt Georgia"
        @ctx.fillStyle = "#586e75"
        @ctx.fillText seconds.toFixed(1) + 's',
                      window.innerWidth - 80,
                      window.innerHeight - 20
        @
        
    drawOrigoIndicator: ->
        @ctx.beginPath()
        @ctx.strokeStyle = "#93a1a1"
        @ctx.moveTo @origoX, 0
        @ctx.lineTo @origoX, 25
        @ctx.stroke()
        @ctx.closePath()
        @

    drawSelection: (toX, fromX) ->
        if toX != fromX or @dragging
            @ctx.fillStyle = @options.selectionFillColor
            @ctx.fillRect fromX,
                          0,
                          toX - fromX,
                          window.innerHeight
        @

    drawSelectionEdge: (x, active=false) ->
        @ctx.beginPath()
        if active 
            @ctx.strokeStyle = @options.selectionEdgeFocusColor
        else
            @ctx.strokeStyle = @options.selectionEdgeColor
        @ctx.moveTo x, 0
        @ctx.lineTo x, window.innerHeight
        @ctx.stroke()
        @ctx.closePath()
        @

    drawSelectionText: (sidebarShowing, from, to, fromX, toX) ->
        @ctx.font = "20pt Georgia"
        @ctx.fillStyle = "#586e75"
        leftOffset = -95
        rightOffset = 20
        lMargin = if sidebarShowing then 350 else 150
        rMargin = 100
        if from < to
            # if close to sides of screen draw, inside selection
            fromX += if fromX > lMargin then leftOffset else rightOffset
            toX   += if window.innerWidth - toX > rMargin then rightOffset else leftOffset
            if toX - fromX < 80 then toY = 60 else toY = 30
            fromY = 30
        else # reverse roles
            fromX += if window.innerWidth - fromX > rMargin then rightOffset else leftOffset
            toX += if toX > lMargin then leftOffset else rightOffset
            if fromX - toX < 80 then fromY = 60 else fromY = 30
            toY = 30
        @ctx.fillText from.toFixed(2) + 's',
                      fromX,
                      fromY
        @ctx.fillText to.toFixed(2) + 's',
                      toX,
                      toY
        @


module.exports = Graph
