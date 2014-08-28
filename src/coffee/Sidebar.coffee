"use strict"

class Sidebar
    constructor: (@view, @hidden=true) ->
        @signals = []
        @view.update @

    add: (signal, color) ->
        @signals.push signal
        @view.add signal, color


module.exports = Sidebar
