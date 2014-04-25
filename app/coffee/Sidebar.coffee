"use strict"

class Sidebar
    constructor: (@view, @hidden=true) ->
        @signals = []
        @view.update @

    add: (signal) ->
        @signals.push signal
        @view.add signal


module.exports = Sidebar
