"use strict"

math = require('mathjs')()

# intended public methods:
#   play()
#   stop()
#   connect()
#   startWindowSelection()
#   endWindowSelection()
class Signal
    constructor: (@fn, @samplerate) ->
        @playing = false
        @window =  { from : 0, to : 0, focused: false } # units in seconds
        @samples = []
        @

    # private; use play()!
    sample: () ->
        if @window.from < @window.to
            start = @window.from
            end = @window.to
        else 
            start = @window.to
            end = @window.from
        nSamples = Math.floor((end - start) * @samplerate)
        @samples = new Float32Array(nSamples)
        delta = 1 / @samplerate
        expr = math.parse(@fn).compile(math)
        scope = { x: start }
        for i in [0 .. nSamples-1]
            do () =>
                scope.x += delta
                @samples[i] = expr.eval(scope)
        @

    # private; use play()!
    createBufferSource: (ctx) ->
        buffer = ctx.createBuffer(1, @samples.length, @samplerate)
        data = buffer.getChannelData(0)
        for i in [0 .. @samples.length-1]
            do () => 
                data[i] = @samples[i]
        @source = ctx.createBufferSource()
        @source.loop = true
        @source.buffer = buffer
        @

    connect: (gain) ->
        @source.connect(gain)
        @

    play: (ctx, gain) ->
        @stop() if @playing
        if @window.from != @window.to
            @playing = true
            @sample()
            @createBufferSource(ctx)
            @connect(gain)
            @source.noteOn(0)
        @

    stop: () ->
        @source.noteOff(0) if @playing
        @playing = false
        @

    startWindowSelection: (s) -> 
        @window.from = s
        @window.to = s
        @window.focused = true
        @

    endWindowSelection: (s) ->
        @window.to = s
        @

module.exports = Signal
