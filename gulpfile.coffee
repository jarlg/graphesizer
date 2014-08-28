gulp = require 'gulp'
browserify = require 'browserify'
source = require 'vinyl-source-stream'

static_files = [
    'index.html'
    'font/*'
    'css/*'
]

errHandler = (err) ->
    console.log err.stack or err
    @end()

gulp.task 'scripts', ->
    browserify './src/coffee/main.coffee'
        .exclude 'mathjs'
        .bundle()
        .pipe source 'main.js'
        .pipe gulp.dest './dist/js/'

gulp.task 'static', ->
    for file in static_files
        do ->
            gulp.dest './dist/'

gulp.task 'watch', [ 'scripts', 'static' ], ->
    gulp
        .watch './src/coffee/*', [ 'scripts' ]
        .on 'error', errHandler
    gulp
        .watch static_files, [ 'static' ]
        .on 'error', errHandler

gulp.task 'default', [ 'scripts', 'static' ]
