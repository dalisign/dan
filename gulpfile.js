var gulp = require('gulp'),
  plumber = require('gulp-plumber'),
  sass = require('gulp-sass'),
  postcss = require('gulp-postcss'),
  cssnano = require('gulp-cssnano'),
  autoprefixer = require('autoprefixer'),
  purify = require('gulp-purifycss'),
  fs = require("fs"),
  inject = require('gulp-inject-string'),
  browserSync = require('browser-sync').create(),
  reload = browserSync.reload,
  rename = require('gulp-rename'),
  nunjucksRender = require('gulp-nunjucks-render'),
  gulpSequence = require('gulp-sequence'),
  gulpAmpValidator = require('gulp-amphtml-validator');

// Nunjucks tasks
// task to render html
gulp.task('nunjucks:render', function () {
  return gulp.src('src/templates/pages/**/*.+(html|nunjucks)')
    // Renders template with nunjucks
    .pipe(
      nunjucksRender({
        path: ['src/templates']
      })
    )
    // Output files in app folder
    .pipe(gulp.dest('src/html'));
});
// task to run sequence
gulp.task('nunjucks', function (callback) {
  gulpSequence('nunjucks:render', 'html')(callback)
});

// Styles tasks
// task to render css
gulp.task('styles', function () {
  return gulp.src('src/sass/app.scss')
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer({
        browsers: ['last 2 versions']
      })
    ]))
    .pipe(gulp.dest('src/html/css'))
    .pipe(sass().on('error', sass.logError))
    .pipe(purify(['src/html/**/*.html']))
    .pipe(postcss([
      autoprefixer({
        browsers: ['last 2 versions']
      })
    ]))
    .pipe(cssnano())
    .pipe(
      rename({
        suffix: '.min'
      })
    )
    .pipe(gulp.dest('src/html/css'));
});
// task to inject styles
gulp.task('html', ['styles'], function () {
  var cssContent = fs.readFileSync('src/html/css/app.min.css', 'utf8');
  return gulp.src('src/html/**/*.html')
    .pipe(plumber())
    .pipe(inject.after('<style amp-custom>', cssContent))
    // Validate the input and attach the validation result to the "amp" property
    // of the file object. 
    .pipe(gulpAmpValidator.validate())
    // Print the validation results to the console.
    .pipe(gulpAmpValidator.format())
    // Exit the process with error code (1) if an AMP validation error
    // occurred.
    .pipe(gulpAmpValidator.failAfterError())
    .pipe(gulp.dest('dist'));
});

// Data folder tasks
gulp.task('watch-data', function () {
  return gulp.src('src/html/json/**/*.json', { base: 'src/html/json' })
    .pipe(plumber())
    .pipe(gulp.dest('dist/json'));
});

// Image folder tasks
gulp.task('watch-images', function () {
  return gulp.src('src/html/img/**/*.+(jpg|png|gif|svg)', { base: 'src/html/img' })
    .pipe(plumber())
    .pipe(gulp.dest('dist/img'));
});

// BrowserSync tasks
gulp.task('browserSync', function () {
  browserSync.init({
    port: 4500,
    open: true,
    ghostMode: false,
    server: {
      baseDir: 'dist'
    }
  });
});

// Run
gulp.task('run', gulpSequence('nunjucks:render', 'styles', 'html', 'watch-data', 'watch-images', 'watch', 'browserSync'));

// Watch tasks
gulp.task('watch', function () {
  gulp.watch('src/templates/**/*.+(html|nunjucks)', ['waitForNunjucks']);
  gulp.watch('src/sass/**/*.scss', ['waitForStyles']);
  gulp.watch('dist/**/*.html', ['waitForHTML']);
  gulp.watch('src/html/json/**/*.json', ['waitForData']);
  gulp.watch('src/html/img/**/*.+(jpg|png|gif|svg)', ['waitForImages']);
});

gulp.task('waitForNunjucks', ['nunjucks'], function () {
  browserSync.reload();
});

gulp.task('waitForStyles', ['html'], function () {
  browserSync.reload();
});

gulp.task('waitForHTML', function () {
  browserSync.reload();
});

gulp.task('waitForData', ['watch-data'], function () {
  browserSync.reload();
});

gulp.task('waitForImages', ['watch-images'], function () {
  browserSync.reload();
});

// Gulp default
gulp.task('default', ['run']);

