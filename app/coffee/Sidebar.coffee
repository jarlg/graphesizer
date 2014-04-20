"use strict"

class Sidebar
    constructor: (@sidebar, @width, @hidden=true) ->
        @signals = []
        @sidebar.style.width = @width + "px"
        @signalList = document.createElement('ul')
        @sidebar.appendChild(@signalList)
            .className = "sidebar-signal-list"
        if @hidden
            @hide()
        else
            @show()

    bindButton: (@button) ->
        @button.innerHTML = if @hidden then ">>" else "<<"
        @button.addEventListener('click', (event) =>
            @toggle()
        )

    toggle: () ->
        @hidden = not @hidden
        @button.innerHTML = if @hidden then ">>" else "<<"
        if @hidden
            @hide()
        else
            @show()

    show: () ->
        @sidebar.style.left = 0 + "px"
        @

    hide: () ->
        @sidebar.style.left = (55 - @width) + "px"
        @

    add: (signal) ->
        @signalList.insertBefore(@makeEntry(signal), @signalList.firstChild)
        @signals.push(signal)
        @

    makeEntry: (signal) ->
        entry = document.createElement('li')
        title = document.createTextNode(signal.fn)

        toggles = document.createElement('div')
        toggles.style.background = signal.color
        txt = document.createTextNode('')
        toggles.appendChild(txt)

        entry.appendChild(title)
        entry.appendChild(toggles)
            .className = 'sidebar-signal-toggle'
        entry.className = 'sidebar-signal'
        entry


module.exports = Sidebar
