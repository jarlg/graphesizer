'use strict'

math = require('mathjs')()

class Graph
    constructor: (@view) ->
        @origoX = window.innerWidth / 2
        @origoY = window.innerHeight / 2

        @dragging  = false
        @selection = from: 0, to: 0

        @zoom  = 1 # s onscreen
        @zoomY = 180 # height in px corresponding to amp 1 in signal

        @view.update @
        @

    options:
        hoverMargin: 20,
        selectionEdgeColor: "#93a1a1",
        selectionEdgeFocusColor: "#586e75",
        selectionFillColor: "rgba(238, 232, 213, 0.5)"

    secondsToX: (s) ->
        ((s * @canvas.width) / @zoom) + @origoX

    xToSeconds: (x) ->
        (x - @origoX) * @zoom / @canvas.width

    _dist: (x1, x2) -> Math.abs(x1 - x2)

    hovering: (x) ->
        if @_dist(@selection.to, x) < @_dist(@selection.from, x)
            if @_dist(@selection.to, x) < @options.hoverMargin
                return @selection.to
        else if @selection.to != @selection.from
            if @_dist(@selection.from, x) < @options.hoverMargin
                return @selection.from
        null

    setZoom: (@zoom) ->
        @view.update @

    setSelection: (@selection) ->
        @view.update @

    setDragging: (@dragging) ->
        @view.update @

    setOrigoX: (@origoX) ->
        @view.update @


module.exports = Graph
