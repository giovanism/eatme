"use strict";

var del = require('del');
var runSequence = require('run-sequence');
var gulp = require('gulp');
var gulpif = require("gulp-if-else");
var htmlmin = require('gulp-htmlmin');
var csso = require('gulp-csso');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');

function isDev() {
    return !process.env.NODE_ENV || process.env.NODE_ENV === "dev"; 
}

gulp.task("clean", function () {
	return del(["dist"]);
});

gulp.task("pages", function () {
    return gulp.src("src/pages/*.html")
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true
        }))
        .pipe(gulp.dest("dist"));
})

gulp.task("css", function () {
    return gulp.src("src/assets/css/*.css")
        .pipe(csso())
        .pipe(gulp.dest("dist/assets/css"));
})

gulp.task("js-core", function () {
    return gulp.src("src/assets/js/core/*.js")
        .pipe(gulpif(isDev(), sourcemaps.init))
        .pipe(babel({
            presets: [["env", {
                "targets": {
                    "uglify": true
                }
            }]]
        }))
        .pipe(concat("index.js"))
        .pipe(uglify({
            "toplevel": true
        }))
        .pipe(gulpif(isDev(), sourcemaps.write))
        .pipe(gulp.dest("dist/assets/js"));
})

gulp.task("js-lib", function () {
    return gulp.src("src/assets/js/lib/*.js")
        .pipe(concat("lib.js"))
        .pipe(gulp.dest("dist/assets/js"));
})

gulp.task("watch", function () {
	gulp.watch("src/pages/*.html", ["pages"]);
	gulp.watch("src/assets/css/*.css", ["css"]);
	gulp.watch("src/assets/js/core/*.js", ["js-core"]);
	gulp.watch("src/assets/js/lib/*.js", ["js-lib"]);
})

gulp.task("build", function () {
    runSequence.options.ignoreUndefinedTasks = true;
    runSequence("clean", "pages", "css", "js-core", "js-lib", isDev() ? "watch" : "");
});
