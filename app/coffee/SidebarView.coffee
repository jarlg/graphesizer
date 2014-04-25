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

    add: (signal) ->
        @signalList.insertBefore @makeEntry(signal), @signalList.firstChild

    show: () ->
        @button.innerHTML = '<<'
        @el.style.left = "0px"

    hide: () ->
        @button.innerHTML = '>>'
        @el.style.left = (@hiddenWidth - @width) + "px"

    toggle: () ->
        @app.sidebar.hidden = not @app.sidebar.hidden
        if @app.sidebar.hidden
            @hide()
        else
            @show()

    makeEntry: (signal) ->
        entry = document.createElement 'li'
        title = document.createTextNode signal.fn

        toggles = document.createElement 'div'
        toggles.style.background = signal.color
        txt = document.createTextNode ''
        toggles.appendChild txt

        entry.appendChild title
        entry.appendChild(toggles)
            .className = 'sidebar-signal-toggle'
        entry.className = 'sidebar-signal'
        entry


module.exports = SidebarView
