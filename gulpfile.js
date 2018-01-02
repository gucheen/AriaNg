var gulp = require('gulp');
var gulpLoadPlugins = require('gulp-load-plugins');
var browserSync = require('browser-sync');
var del = require('del');

var $ = gulpLoadPlugins();
var reload = browserSync.reload;

gulp.task('styles', function () {
    return gulp.src([
        'src/styles/**/*.css'
    ]).pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
        .pipe(gulp.dest('.tmp/styles'))
        .pipe(reload({stream: true}));
});

gulp.task('scripts', function () {
    return gulp.src([
        'src/scripts/**/*.js'
    ]).pipe($.plumber())
        .pipe(gulp.dest('.tmp/scripts'))
        .pipe(reload({stream: true}));
});

gulp.task('views', function () {
    return gulp.src([
        'src/views/**/*.html'
    ]).pipe($.htmlmin({collapseWhitespace: true}))
        .pipe($.angularTemplatecache({module: 'ariaNg', filename: 'views/templates.js', root: 'views/'}))
        .pipe(gulp.dest('.tmp/scripts'));
});

gulp.task('lint', function () {
    return gulp.src([
        'src/scripts/**/*.js'
    ]).pipe(reload({stream: true, once: true}))
        .pipe($.eslint.format())
        .pipe($.if(!browserSync.active, $.eslint.failAfterError()))
        .pipe(gulp.dest('src/scripts'));
});

gulp.task('html', ['styles', 'scripts', 'views'], function () {
    return gulp.src([
        'src/*.html'
    ]).pipe($.useref({searchPath: ['.tmp', 'src', '.']}))
        .pipe($.injectVersion())
        .pipe($.if('js/*.js', $.replace(/\/\/# sourceMappingURL=.*/g, '')))
        .pipe($.if('css/*.css', $.replace(/\/\*# sourceMappingURL=.* \*\/$/g, '')))
        .pipe($.if(['js/moment-with-locales-*.min.js', 'js/plugins.min.js', 'js/aria-ng.min.js'], $.uglify({preserveComments: 'license'})))
        .pipe($.if(['css/plugins.min.css', 'css/aria-ng.min.css'], $.cssnano({safe: true, autoprefixer: false})))
        .pipe($.if(['js/plugins.min.js', 'js/aria-ng.min.js', 'css/plugins.min.css', 'css/aria-ng.min.css'], $.rev()))
        .pipe($.if('*.html', $.htmlmin({collapseWhitespace: true})))
        .pipe($.revReplace())
        .pipe(gulp.dest('../public'));
});

gulp.task('langs', function () {
    return gulp.src([
        'src/langs/**/*'
    ]).pipe(gulp.dest('../public/langs'));
});

gulp.task('images', function () {
    return gulp.src([
        'src/imgs/**/*'
    ]).pipe(gulp.dest('../public/imgs'));
});

gulp.task('fonts', function () {
    return gulp.src([
        'node_modules/font-awesome/fonts/fontawesome-webfont.*'
    ]).pipe(gulp.dest('.tmp/fonts'))
        .pipe(gulp.dest('../public/fonts'));
});

gulp.task('manifest', function () {
    return gulp.src([
        '../public/css/**',
        '../public/js/**',
        '../public/fonts/fontawesome-webfont.woff2',
        '../public/*.html',
        '../public/*.ico',
        '../public/*.png'
    ], {base: '../public/'})
        .pipe($.manifest({
            hash: true,
            preferOnline: true,
            network: ['*'],
            filename: 'index.manifest',
            exclude: 'index.manifest'
        }))
        .pipe(gulp.dest('../public'));
});

gulp.task('extras', function () {
    return gulp.src([
        'LICENSE',
        'src/*.*',
        '!src/*.html'
    ], {
        dot: true
    }).pipe(gulp.dest('../public'));
});

gulp.task('clean', del.bind(null, ['.tmp', '../public']));

gulp.task('serve', ['styles', 'scripts', 'fonts'], function () {
    browserSync({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['.tmp', 'src'],
            routes: {
                '/node_modules': 'node_modules'
            }
        }
    });

    gulp.watch([
        'src/*.html',
        'src/*.ico',
        'src/*.png',
        'src/langs/*.txt',
        'src/views/*.html',
        'src/imgs/**/*',
        '.tmp/fonts/**/*'
    ]).on('change', reload);

    gulp.watch('src/styles/**/*.css', ['styles']);
    gulp.watch('src/scripts/**/*.js', ['scripts']);
    gulp.watch('src/fonts/**/*', ['fonts']);
});

gulp.task('serve:dist', function () {
    browserSync({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['../public']
        }
    });
});

gulp.task('info', function () {
    return gulp.src([
        '../public/**/*'
    ]).pipe($.size({title: 'build', gzip: true}));
});

gulp.task('build', $.sequence('lint', 'html', 'langs', 'images', 'fonts', 'manifest', 'extras', 'info'));

gulp.task('default', ['clean'], function () {
    gulp.start('build');
});
