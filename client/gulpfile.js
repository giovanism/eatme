'use strict'

const del = require('del')
const runSequence = require('run-sequence')
const gulp = require('gulp')
const gulpif = require('gulp-if-else')
const pug = require('gulp-pug')
const htmlmin = require('gulp-htmlmin')
const csso = require('gulp-csso')
const uglify = require('gulp-uglify')
const babel = require('gulp-babel')
const browserify = require('gulp-browserify')
const concat = require('gulp-concat')
const sourcemaps = require('gulp-sourcemaps')
const rename = require('gulp-rename')

const isDev = () => !process.env.NODE_ENV || process.env.NODE_ENV === 'dev'

gulp.task('clean', () => {
  return del(['dist'])
})

gulp.task('pages', () => {
  return gulp.src('src/pages/*.pug')
    .pipe(pug({
      basedir: '.'
    }))
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true
    }))
    .pipe(gulp.dest('dist'))
})

gulp.task('images', () => {
  return gulp.src('src/assets/images/**/*')
    .pipe(gulp.dest('dist/assets/images'))
})

gulp.task('fonts', () => {
  return gulp.src('src/assets/fonts/**/*')
    .pipe(gulp.dest('dist/assets/fonts'))
})

gulp.task('css-core', () => {
  return gulp.src(['src/assets/css/core/font.css', 'src/assets/css/core/**/*.css'])
    .pipe(csso())
    .pipe(concat('index.css'))
    .pipe(gulp.dest('dist/assets/css'))
})

gulp.task('css-lib', () => {
  return gulp.src('src/assets/css/lib/**/*.css')
    .pipe(concat('lib.css'))
    .pipe(gulp.dest('dist/assets/css'))
})

gulp.task('js-core', () => {
  return gulp.src('src/assets/js/core/index-' + (isDev() ? 'dev' : 'prod') + '.js')
    .pipe(rename('index.js'))
    .pipe(browserify())
    .pipe(babel({
      presets: [['env', {
        'targets': {
          'uglify': true
        }
      }]]
    }))
    .pipe(gulpif(isDev(), sourcemaps.init))
    .pipe(uglify({
      'toplevel': true
    }))
    .pipe(gulpif(isDev(), sourcemaps.write))
    .pipe(gulp.dest('dist/assets/js'))
})

gulp.task('js-lib', () => {
  return gulp.src(['src/assets/js/lib/jquery.min.js', 'src/assets/js/lib/**/*.js'])
    .pipe(concat('lib.js'))
    .pipe(gulp.dest('dist/assets/js'))
})

gulp.task('watch', () => {
  gulp.watch('src/pages/**/*.pug', ['pages'])
  gulp.watch('src/assets/images/**/*', ['images'])
  gulp.watch('src/assets/fonts/**/*', ['fonts'])
  gulp.watch('src/assets/css/core/**/*.css', ['css-core'])
  gulp.watch('src/assets/css/lib/**/*.css', ['css-lib'])
  gulp.watch('src/assets/js/core/**/*.js', ['js-core'])
  gulp.watch('src/assets/js/lib/**/*.js', ['js-lib'])
})

gulp.task('build', () => {
  runSequence.options.ignoreUndefinedTasks = true
  runSequence('clean', 'pages', 'images', 'fonts', 'css-core',
    'css-lib', 'js-core', 'js-lib', isDev() ? 'watch' : '')
})
