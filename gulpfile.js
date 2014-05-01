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
    html :  './app/index.html',
    css  : './app/css/*',
    font : './app/font/*'
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


gulp.task('html', function () {
    return gulp.src(paths.html)
                .pipe(gulp.dest('dist'));
});

gulp.task('css', function () {
    return gulp.src(paths.css)
                .pipe(gulp.dest('dist/css'));
});

gulp.task('font', function () {
    return gulp.src(paths.font)
                .pipe(gulp.dest('dist/font'));
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
    gulp.watch(paths.html, ['html']);
    gulp.watch(paths.css, ['css']);
    
    var server = livereload();
    gulp.watch('./dist/**').on('change', function (file) {
        server.changed(file.path);
    });
});


gulp.task('default', ['browserify', 'html', 'css', 'font']);
