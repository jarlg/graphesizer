var gulp = require('gulp');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var coffeeify = require('coffeeify');
var browserify = require('browserify');
var streamify = require('gulp-streamify');
var source = require('vinyl-source-stream');
var livereload = require('gulp-livereload');

var paths = {
    coffee  : './app/coffee/*.coffee',
    statiq  : './app/*.{html,css}'
};

gulp.task('browserify', function () {
    return browserify('./app/coffee/main.coffee')
                    .transform(coffeeify)
                    .exclude('mathjs')
                    .bundle()
                    .pipe(source(paths.coffee))
                    //.pipe(streamify(uglify()))
                    .pipe(streamify(rename('main.js')))
                    .pipe(gulp.dest('dist/js'));
});


gulp.task('static', function () {
    return gulp.src(paths.statiq)
                .pipe(gulp.dest('dist'));
});

gulp.task('serve', function(next) {
    var staticS = require('node-static'),
    server = new staticS.Server('./dist'),
    port = 8000;
    require('http').createServer(function (request, response) {
        request.addListener('end', function () {
            server.serve(request, response);
        }).resume();
    }).listen(port, function() {
        //gutil.log('Server listening on port: ' + gutil.colors.magenta(port));
        next();
    });
});

gulp.task('watch', ['serve'], function () {
    gulp.watch(paths.coffee, ['browserify']);
    gulp.watch(paths.statiq, ['static']);
    
    var server = livereload();
    gulp.watch('./dist/**').on('change', function (file) {
        server.changed(file.path);
    });
});


gulp.task('default', ['browserify', 'static']);
