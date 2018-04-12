"use strict";

var del = require('del');
var runSequence = require('run-sequence');
var gulp = require('gulp');
var gulpif = require("gulp-if-else");
var htmlmin = require('gulp-htmlmin');
var csso = require('gulp-csso');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var browserify = require('gulp-browserify');
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

gulp.task("css-core", function () {
    return gulp.src("src/assets/css/core/*.css")
        .pipe(csso())
        .pipe(concat("index.css"))
        .pipe(gulp.dest("dist/assets/css"));
})

gulp.task("css-lib", function () {
    return gulp.src("src/assets/css/lib/*.css")
        .pipe(concat("lib.css"))
        .pipe(gulp.dest("dist/assets/css"));
})

gulp.task("js-core", function () {
    return gulp.src("src/assets/js/core/index.js")
        .pipe(gulpif(isDev(), sourcemaps.init))
        .pipe(browserify())
        .pipe(babel({
            presets: [["env", {
                "targets": {
                    "uglify": true
                }
            }]]
        }))
        .pipe(uglify({
            "toplevel": true
        }))
        .pipe(gulpif(isDev(), sourcemaps.write))
        .pipe(gulp.dest("dist/assets/js"));
})

gulp.task("js-lib", function () {
    return gulp.src(["src/assets/js/lib/jquery.min.js", "src/assets/js/lib/*.js"])
        .pipe(concat("lib.js"))
        .pipe(gulp.dest("dist/assets/js"));
})

gulp.task("watch", function () {
	gulp.watch("src/pages/*.html", ["pages"]);
	gulp.watch("src/assets/css/core/*.css", ["css-core"]);
	gulp.watch("src/assets/css/lib/*.css", ["css-lib"]);
	gulp.watch("src/assets/js/core/*.js", ["js-core"]);
	gulp.watch("src/assets/js/lib/*.js", ["js-lib"]);
})

gulp.task("build", function () {
    runSequence.options.ignoreUndefinedTasks = true;
    runSequence("clean", "pages", "css-core", "css-lib",
        "js-core", "js-lib", isDev() ? "watch" : "");
});
