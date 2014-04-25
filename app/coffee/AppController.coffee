"use strict"

math = require('mathjs')()

Signal = require './Signal.coffee'
Audio = require './Audio.coffee'

GraphView = require './GraphView.coffee'
Graph = require './Graph.coffee'

Sidebar = require './Sidebar.coffee'
SidebarView = require './SidebarView.coffee'

class App
    constructor: (@canvas, sidebar, @input, @samplerate) ->
        @currentSignal = null
        @signalColors = []

        @gView = new GraphView @canvas, @
        @graph = new Graph @gView

        @sidebarView = new SidebarView sidebar, @
        @sidebar = new Sidebar @sidebarView

        @audio = new Audio new webkitAudioContext(), @

        @input.addEventListener 'keydown', () => @updateCurrentSignal()


    setLineWidth: (lineWidth) -> @gView.ctx.lineWidth = lineWidth; @
    setSignalColors: (@signalColors) -> @
    nextColor: -> @signalColors[@sidebar.signals.length % @signalColors.length]

    validate: (value) ->
        try
            expr = math.parse(value).compile(math)
            return true
        catch e
            return false

    updateCurrentSignal: ->
        if @validate @input.value
            if @currentSignal?
                oldSignalState = @currentSignal.state()
                try
                    @currentSignal.update
                                fn: @input.value
                                window: 
                                    to: @graph.selection.to,
                                    from: @graph.selection.from
                catch e
                    @currentSignal.update oldSignalState
            else
                try @currentSignal = new Signal @input.value, @audio
                catch e
                    @currentSignal = null


module.exports = App
