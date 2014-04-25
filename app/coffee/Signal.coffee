"use strict"

math = require('mathjs')()

# MODEL
# intended public methods:
#   play()
#   stop()
#   connect()
#   startWindowSelection()
#   endWindowSelection()
class Signal
    constructor: (@fn, @audioView) ->
        @window = from : 0, to : 0 # units in seconds

    # private; use play()!
    sample: (samplerate) ->
        if @window.from < @window.to
            start = @window.from
            end = @window.to
        else 
            start = @window.to
            end = @window.from
        nSamples = Math.floor((end - start) * samplerate)
        samples = new Float32Array nSamples
        delta = 1 / samplerate
        expr = math.parse(@fn).compile(math)
        scope =  x: start 
        for i in [0 .. nSamples-1]
            do =>
                scope.x += delta
                samples[i] = expr.eval scope
        samples

    update: (obj) ->
        updateView = false
        for own key, val of obj
            do () =>
                if val? and @[key] != val
                    @[key] = val
                    updateView = true
        if updateView
            @audioView.update @

    state: ->
        fn: @fn,
        window:
            from: @window.from,
            to: @window.to


module.exports = Signal
