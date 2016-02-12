// Automatically load Gulp plugins
require('matchdep').filterDev('gulp*').forEach(function( module ) {
  var module_name = module.replace(/^gulp-/, '').replace(/-/, '');
  if (module_name==='postcss') module_name = 'postCSS';
  global[module_name] = require(module);
});

// Define filepaths
var paths = {
  styles: {
    src: 'source/styles/main.css',
    destDir: 'static/css/',
    destFile: 'main.min.css',
    watch: 'source/styles/**/*.css'
  },
  scripts: {
    src: 'source/scripts/*.js',
    destDir: 'static/js/'
  },
  images: {
    src: 'source/images/**/*',
    destDir: 'static/images/',
    watch: [ 'source/images/**/*', '!source/images/**/*@2x.{jpg,png}' ]
  }
};

// Load the plugin into a variable
var lazypipe = require('lazypipe');

// Styles Build
var processors = [
  require('precss'),
  require('postcss-quantity-queries'),
  require('postcss-pxtorem'),
  require("postcss-color-function")
];

gulp.task('styles', ['clean:styles'], function(  ) {
  gulp.src(paths.styles.src)
    .pipe(sourcemaps.init())
    .pipe(postCSS(processors))
    .pipe(cssnext())
    .pipe(cssnano())
    .pipe(rename(paths.styles.destFile))
    .pipe(gulp.dest(paths.styles.destDir));
});

gulp.task('styles:browser-support', function(  ) {
  var doiuse = require('doiuse')({
    browsers:['ie >= 10, > 1%, last 2 versions'],
    onFeatureUsage: function(usageInfo) {
      console.log(usageInfo.message.replace(__dirname, ''));
    }
  });

  gulp.src(paths.styles.src)
    .pipe(postcss(processors))
    .pipe(cssnext())
    .pipe(postcss([doiuse]));
});

// Script Builds
gulp.task('scripts', ['clean:scripts'], function(  ) {
  gulp.src(paths.scripts.src)
    .pipe(using())
    .pipe(jscs({
      preset: 'airbnb',
      esnext: true
    }))
    .on('error', function( error ) { console.log(error.message); })
    .pipe(sourcemaps.init())
    .pipe(concat('main.js'))
    .pipe(babel())
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.scripts.destDir));
});

gulp.task('scripts:fix', function( ) {
  gulp.src(paths.scripts.src)
    .pipe(jscs({
      preset: 'airbnb',
      esnext: true,
      fix: true
    }))
    .pipe(rename({ suffix: '.fixed' }))
    .pipe(gulp.dest('source/scripts/'));
});

// Image Builds
gulp.task('images', ['clean:images'], function(  ) {
  var pngquant = require('imagemin-pngquant');
  gulp.src(paths.images.src)
    .pipe(changed(paths.images.destDir))
    .pipe(using())
    .pipe(imagemin({
      progressive: true,
      use: [ pngquant() ]
    }))
    .pipe(gulp.dest(paths.images.destDir));
});

// Empty Directories
var del = require('del');
gulp.task('clean:styles', function(  ) {
  del([
    'static/css/*.*',
    'static/maps/**.css.map'
  ]);
});

gulp.task('clean:images', function(  ) {
  del([
    'static/images/**.*'
  ]);
});

gulp.task('clean:scripts', function(  ) {
  del([
    'static/js/**.*',
    'static/maps/**.js.map'
  ]);
});

// LiveReload
gulp.task('watch', function(  ) {
  livereload.listen();
  gulp.watch(paths.styles.watch, ['styles']);
  gulp.watch(paths.scripts.src, ['scripts']);
  gulp.watch(paths.images.watch, ['images']);
});

// The Default Task
gulp.task('default', ['watch']);
