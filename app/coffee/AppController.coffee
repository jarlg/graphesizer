"use strict"

math = require('mathjs')()

Signal = require './Signal.coffee'
Audio = require './Audio.coffee'

Graph = require './Graph.coffee'

Sidebar = require './Sidebar.coffee'
SidebarView = require './SidebarView.coffee'

class App
    constructor: (canvas, sidebar, @input, @samplerate, @debug=false) ->
        @signal = null
        @signalColors = []

        @graph = new Graph canvas, @

        @sidebarView = new SidebarView sidebar, @
        @sidebar = new Sidebar @sidebarView

        @audio = new Audio new webkitAudioContext(), @

        @input.addEventListener 'keyup', () => @updateCurrentSignal()
        @graph.canvas.addEventListener 'mousedown', (event) => @beginDrag event
        @graph.canvas.addEventListener 'mouseup', (event) => @endDrag event
        @graph.canvas.addEventListener 'mousemove', (event) => @update event
        @graph.canvas.addEventListener 'mousewheel', (event) => @zoom event


    setLineWidth: (lineWidth) -> @graph.ctx.lineWidth = lineWidth; @
    setSignalColors: (@signalColors) -> @
    nextColor: -> @signalColors[@sidebar.signals.length % @signalColors.length]

    validate: (value) ->
        try
            expr = math.parse(value).compile(math)
            return true
        catch e
            return false

    update: (event) ->
        if @signal?
            toX = @graph.secondsToX @signal.window.to
            fromX = @graph.secondsToX @signal.window.from
            if @graph.dragging
                @signal.update 
                            window: 
                                from: @signal.window.from,
                                to: @graph.xToSeconds event.x
            else if toX != fromX
                if @graph.hovering toX, event.x
                    if Math.abs(toX - event.x) < Math.abs(fromX - event.x)
                        @graph.updateActive to: true, from: false
                else if @graph.hovering fromX, event.x
                    if Math.abs(fromX - event.x) < Math.abs(toX - event.x)
                        @graph.updateActive to: false, from: true
                else
                    @graph.updateActive from: false, to: false
            else
                @graph.updateActive from: false, to: false

    updateCurrentSignal: ->
        if @validate @input.value
            if @signal?
                oldSignalState = @signal.state()
                try
                    @signal.update
                                fn: @input.value
                catch e
                    console.log e if @debug
                    @signal.update oldSignalState
            else
                try @signal = new Signal @input.value, @audio, @graph
                catch e
                    console.log e if @debug
                    @signal = null

    # dragging is changing @signal.window.to on mousemove
    # dragging = true flag makes this happen
    # if hovering a previous selection edge, continue dragging
    beginDrag: (event) ->
        if @signal?
            @graph.dragging = true
            if @graph.activeSelectionEdges.to
                @signal.update
                        window: 
                            from: @signal.window.from
                            to  : @graph.xToSeconds(event.x)
            else if @graph.activeSelectionEdges.from
                @signal.update
                        window: 
                            from: @signal.window.to
                            to  : @graph.xToSeconds(event.x)
            else
                @signal.update
                        window: 
                            from: @graph.xToSeconds(event.x),
                            to  : @graph.xToSeconds(event.x)

    endDrag: (event) ->
        if @signal?
            @graph.dragging = false
            @signal.update 
                        window: 
                            to: @graph.xToSeconds event.x
                            from: @signal.window.from

    zoom: (event) ->
        if @signal?
            if @graph.zoom > 10
                @graph.zoom += event.deltaY
            else if @graph.zoom > 1
                @graph.zoom += event.deltaY / 10  
            else if @graph.zoom >= 0
                @graph.zoom += event.deltaY / 100

            @graph.zoom = 0 if @graph.zoom < 0
            @graph.draw @signal


module.exports = App
