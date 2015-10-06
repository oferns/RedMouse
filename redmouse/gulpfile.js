/// <binding ProjectOpened='watch' />
'use strict';


var gulp = require('gulp')
var stylus = require('gulp-stylus');
var nib = require('nib');


//////////////////////////////
// Stylus Tasks
//////////////////////////////
gulp.task('styles', function () {
    gulp.src('public/stylesheets/*.styl')
        .pipe(stylus({
        paths: ['node_modules', 'styles/globals'],
        import: ['jeet/stylus/jeet', 'stylus-type-utils', 'nib', 'rupture/rupture','axis/axis'],
        use: [nib()],
        'include css': true
    }))
        .pipe(gulp.dest('public/stylesheets/'))
});


gulp.task('watch', function () {
    gulp.watch('public/stylesheets/*.styl', ['styles']);
});