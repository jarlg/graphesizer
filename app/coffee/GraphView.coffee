'use strict'

math = require('mathjs')()

class GraphView
    constructor: (@canvas, @app) ->
        @canvas.height = window.innerHeight
        @canvas.width = window.innerWidth
        @ctx = @canvas.getContext "2d"
        @

    clear: -> @canvas.width = @canvas.width

    update: (graph) -> 
        @draw(@app.currentSignal, graph) if @app.currentSignal?

    draw: (signal, graph) -> 
        toX   = graph.secondsToX graph.selection.to
        fromX = graph.secondsToX graph.selection.from
        @drawSignal signal, graph.zoom, graph.zoomY,
                    graph.origoX, graph.origoY
        @drawTotalSecondsOnScreen graph.xToSeconds(window.innerWidth + graph.origoX)
        @drawOrigoIndicator graph.origoX
        @drawSelection toX,
                       fromX,
                       graph.dragging,
                       graph.options
        @drawSelectionText not @app.sidebar.hidden,
                           graph.selection.from,
                           graph.selection.to,
                           fromX,
                           toX
        if graph.dragging
            @drawSelectionEdge fromX,
                               false,
                               graph.options
            @drawSelectionEdge toX,
                               true,
                               graph.options
        else
            @drawSelectionEdge fromX,
                               graph.hovering fromX,
                               graph.options
            @drawSelectionEdge toX,
                               graph.hovering toX,
                               graph.options
        @

    drawSignal: (signal, zoom, zoomY, origoX, origoY) ->
        expr = math.parse(signal.fn).compile(math)
        delta = zoom / @canvas.width
        scope =  x: origoX
        @ctx.moveTo 0, expr.eval scope
        @ctx.beginPath()
        @ctx.strokeStyle = signal.color
        for i in [1 .. @ctx.canvas.width-1]
            do => 
                scope.x += delta
                @ctx.lineTo i, zoomY * expr.eval(scope) + origoY
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
        
    drawOrigoIndicator: (origoX) ->
        @ctx.beginPath()
        @ctx.strokeStyle = "#93a1a1"
        @ctx.moveTo origoX, 0
        @ctx.lineTo origoX, 25
        @ctx.stroke()
        @ctx.closePath()
        @


    drawSelection: (toX, fromX, dragging, options) ->
        if toX != fromX or dragging
            @ctx.fillStyle = options.selectionFillColor
            @ctx.fillRect fromX,
                          0,
                          toX - fromX,
                          window.innerHeight
        @

    drawSelectionEdge: (x, hovering, options) ->
        if hovering?
            @ctx.beginPath()
            if hovering
                @ctx.strokeStyle = options.selectionEdgeFocusColor
            else
                @ctx.strokeStyle = options.selectionEdgeColor
            @ctx.moveTo x, 0
            @ctx.lineTo x, window.innerHeight
            @ctx.stroke()
            @ctx.closePath()
       @

    # sidebarShowing = null if no sidebar
    drawSelectionText: (sidebarShowing, from, to, fromX, toX) ->
        @ctx.font = "20pt Georgia"
        @ctx.fillStyle = "#586e75"
        leftOffset = -95
        rightOffset = 20
        if sidebarShowing? 
            lMargin = if sidebarShowing then 350 else 150
        else
            lMargin = 100
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


module.exports = GraphView
