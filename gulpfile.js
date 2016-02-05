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
  templates: {
    src: ['layouts/partials/scripts.html','layouts/partials/head.html'],
    destDir: 'layouts/partials/'
  },
  images: {
    src: 'source/images/**/*',
    destDir: 'static/images/',
    watch: [ 'source/images/**/*', '!source/images/**/*@2x.{jpg,png}' ]
  }
};

// Load the plugin into a variable
var lazypipe = require('lazypipe');

function addFileRevision( dest ) {
  var sourceRoot = dest.indexOf('js')!==-1 ? '/scripts/' : '/source/';

  return lazypipe()
    .pipe(rev)
    .pipe(sourcemaps.write, '../maps', { sourceRoot: sourceRoot })
    .pipe(gulp.dest, dest)
    .pipe(rev.manifest, 'source/rev-manifest.json', {
      base: process.cwd()+'/static',
      merge: true
    })
    .pipe(gulp.dest, 'static');
}

// Styles Build
var processors = [
  require('postcss-import')({ glob: true }),
  require('postcss-mixins')({
    mixinsDir: process.cwd() + '/source/scripts/postcss/mixins/'
  }),
  require('postcss-nested'),
  require('postcss-simple-vars'),
];

gulp.task('styles', ['clean:styles'], function(  ) {
  var createRevision = addFileRevision(paths.styles.destDir);

  gulp.src(paths.styles.src)
    .pipe(sourcemaps.init())
    .pipe(postCSS(processors))
    .pipe(cssnext())
    .pipe(cssnano())
    .pipe(rename(paths.styles.destFile))
    .pipe(gulp.dest(paths.styles.destDir))
    .pipe(createRevision());
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
  var createRevision = addFileRevision(paths.scripts.destDir);
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
    .pipe(gulp.dest(paths.scripts.destDir))
    .pipe(createRevision());
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

// Dependency Management
gulp.task('dependencies:app', function(  ) {
  var styles = gulp.src([
    'static/css/main.min.css',
    'static/js/main.min.js'
  ], { read: false });
  gulp.src(paths.templates.src)
    .pipe(inject(styles, { ignorePath: 'static' }))
    .pipe(revreplace({
      manifest: gulp.src('source/rev-manifest.json'),
      replaceInExtensions: ['.html']
    }))
    .pipe(gulp.dest(paths.templates.destDir));
});

// Bower
gulp.task('dependencies:bower', function(  ) {
  var wiredep = require('wiredep').stream;
  gulp.src(paths.templates.src)
    .pipe(wiredep({ devDependencies: true, ignorePath: '../../public' }))
    .pipe(gulp.dest(paths.templates.destDir));
});

// LiveReload
gulp.task('watch', function(  ) {
  livereload.listen();
  gulp.watch(paths.styles.watch, ['styles']);
  gulp.watch(paths.scripts.src, ['scripts']);
  gulp.watch('source/rev-manifest.json', ['dependencies:app']);
  gulp.watch(paths.images.watch, ['images']);
  gulp.watch(['bower.json', '.bowerrc'], ['dependencies:bower']);
});

// The Default Task
gulp.task('default', ['watch']);
