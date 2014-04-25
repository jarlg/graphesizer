'use strict'

#VIEW
class Audio
    constructor: (@ctx, @app) ->
        @playing = false
        @source = null
        @gain = @ctx.createGain()
        @gain.gain.value = 0.5
        @gain.connect @ctx.destination

    update: (model) ->
        @createBufferSource model.sample(@app.samplerate)

    createBufferSource: (samples) ->
        if samples.length > 0
            buffer = @ctx.createBuffer 1, samples.length, @app.samplerate
            data = buffer.getChannelData 0
            for i in [0 .. samples.length-1]
                do (data, i, samples) -> 
                    data[i] = samples[i]
            @source = @ctx.createBufferSource()
            @source.loop = true
            @source.buffer = buffer
        else
            @source = null

    play: ->
        if @source? and not @playing
            @source.connect @gain
            @source.noteOn 0 
            @playing = true

    stop: ->
        @source.noteOff(0) if @source? and @playing
        @playing = false


module.exports = Audio
