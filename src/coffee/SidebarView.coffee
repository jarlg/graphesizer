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

        playButton = document.createElement 'i'
        playButton.className = 'icon icon-play'
        toggles.appendChild play
        playButton.addEventListener 'mouseup', (event) =>
            if not signal.audio.playing
                signal.play()
                playButton.className = 'icon icon-stop'
            else
                signal.audio.stop()
                playButton.className = 'icon icon-play'

        looop = document.createTextNode 'l'
        toggles.appendChild looop
        looop.addEventListener 'mouseup', (event) => 
            signal.audio.loop = not signal.audio.loop
            signal.play() if signal.audio.playing

        n = @app.sidebar.signals.length
        key = document.createTextNode n
        toggles.appendChild key
        window.addEventListener 'keypress', (event) =>
            if event.keyCode == 48 + n and not signal.audio.playing
                signal.play()
                play.className = 'icon icon-stop'

        window.addEventListener 'keyup', (event) =>
            if event.keyCode == 48 + n and signal.audio.playing
                signal.audio.stop()
                play.className = 'icon icon-play'

        entry.appendChild title
        entry.appendChild toggles
        entry.className = 'sidebar-signal'
        entry


module.exports = SidebarView
