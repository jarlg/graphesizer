"use strict"

App = require('./App.coffee')
Input = require('./Input.coffee')
Sidebar = require('./Sidebar.coffee')

# let's you write $('#graph') instead of document.querySelector('#graph')
$ = document.querySelector.bind(document)

# conf
samplerate = 48000

app = new App($('#graph'), samplerate)
app.sidebar = new Sidebar($('#sidebar'), 250)
app.sidebar.bindButton($('#sidebar-toggle'))
app.bindInput(new Input($('#fn-input')))

app.setSignalColors(["#b58900",    #"yellow"  
                     "#dc322f",    #"red"     
                     "#d33682",    #"magenta" 
                     "#6c71c4",    #"violet"  
                     "#268bd2",    #"blue"    
                     "#2aa198",    #"cyan"    
                     "#cb4b16",    #"orange"  
                     "#859900"])   #"green"   
   .setLineWidth(3)
