"use strict"

math = require('mathjs')()

Signal = require './Signal.coffee'
Audio = require './Audio.coffee'

Graph = require './Graph.coffee'

Sidebar = require './Sidebar.coffee'
SidebarView = require './SidebarView.coffee'

class App
    constructor: (canvas, sidebar, @input, @samplerate) ->
        @signal = null
        @signalColors = []

        @graph = new Graph canvas, @

        @sidebarView = new SidebarView sidebar, @
        @sidebar = new Sidebar @sidebarView

        @audio = new Audio new webkitAudioContext(), @

        @input.addEventListener 'keyup', () => @updateCurrentSignal()
        @graph.addEventListener 'mousemove', (event) => @update event
        @graph.addEventListener 'mousedown', (event) => @beginDrag event
        @graph.addEventListener 'mouseup', (event) => @endDrag event


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
            if @graph.dragging
                @signal.update 
                            window: 
                                from: @signal.window.from
                                to: @graph.xToSeconds event.x
        # also handle selectionEdgeHover

    updateCurrentSignal: ->
        if @validate @input.value
            if @signal?
                oldSignalState = @signal.state()
                try
                    @signal.update
                                fn: @input.value
                catch e
                    console.log e
                    @signal.update oldSignalState
            else
                try @signal = new Signal @input.value, @audio, @graph
                catch e
                    console.log e
                    @signal = null

    # dragging is changing @signal.window.to on mousemove
    # dragging = true flag makes this happen
    # if hovering a previous selection edge, continue dragging
    beginDrag: (event) ->
        if @signal?
            @graph.dragging = true
            @signal.update
                        window:
                            from: @graph.xToSeconds event.x
                            to: @graph.xToSeconds event.x
            hover = @graph.hovering(@signal, event.x)
            if hover? and hover == @signal.window.from
                [@signal.window.from, @signal.window.to] = [@signal.window.to, @signal.window.from]

    endDrag: (event) ->
        if @signal?
            @graph.dragging = false
            @signal.update 
                        window: 
                            to: @graph.xToSeconds event.x
                            from: @signal.window.from
            @audio.play()


module.exports = App
