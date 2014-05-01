'use strict'

class SidebarView
    constructor: (@el, @app) ->
        @width = 250
        @hiddenWidth = 55
        @button = document.createElement 'button'
        @button.addEventListener 'click', () => @toggle()
        @el.appendChild(@button)
            .id = 'sidebar-toggle'
        @signalList = document.createElement 'ul'
        @el.appendChild(@signalList)
            .className = 'sidebar-signal-list'

    update: (model) ->
        @el.style.width = model.width + "px"
        if model.hidden
            @hide()
        else
            @show()

    add: (signal, color) ->
        @signalList.insertBefore @makeEntry(signal, color), @signalList.firstChild

    show: ->
        @button.innerHTML = '<<'
        @el.style.left = "0px"

    hide: ->
        @button.innerHTML = '>>'
        @el.style.left = (@hiddenWidth - @width) + "px"

    toggle: ->
        @app.sidebar.hidden = not @app.sidebar.hidden
        if @app.sidebar.hidden
            @hide()
        else
            @show()

    makeEntry: (signal, color) ->
        entry = document.createElement 'li'
        title = document.createTextNode signal.fn

        toggles = document.createElement 'div'
        toggles.style.background = color
        toggles.className = 'sidebar-signal-toggle'

        play = document.createElement 'i'
        play.className = 'icon icon-play'
        toggles.appendChild play

        toggles.addEventListener 'mouseup', (event) =>
            if not signal.audio.playing
                signal.play()
            else
                signal.audio.stop()

        entry.appendChild title
        entry.appendChild toggles
        entry.className = 'sidebar-signal'
        entry


module.exports = SidebarView
