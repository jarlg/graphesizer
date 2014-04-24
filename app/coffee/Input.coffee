"use strict"

class Input
    constructor: (@input) ->
        @

    value: () ->
        @input.value

    addEventListener: window.addEventListener.bind(@input)

module.exports = Input
