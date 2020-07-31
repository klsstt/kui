// 引入gulp及插件
const { gulp,watch,series,src,dest } = require('gulp')
const fs = require('fs') 
const imagemin = require('gulp-imagemin') // 图片压缩
const uglify = require('gulp-uglify') // js压缩
const sass = require('gulp-sass')// sass编译
var css = require('gulp-clean-css');
const concat = require('gulp-concat') // 代码合并// 任务：拷贝html
// 定义参数
var app = {  
    model:'dev',
    srcPath:'src/',
    distPath:'dist/'
}

function copyHtml(){
    // 选取到src目录下的所有html文件 （为了测试效果，请自己再src目录下随便创建两个html文件咯）
    return src(app.srcPath + '*.html')
        .pipe(dest('dist')); // 将html拷贝到dist目录下，没有dist会自动生成
}
// 任务： 图片压缩
function build_image(){
    return src(app.srcPath + 'images/**/*.*')
        //.pipe(imagemin()) // 调用插件imagemin
        .pipe(dest(app.distPath + 'images')) // 压缩后的图片输出目录
    
}
// sass 编译 src目录下件文件夹sass然后在里面新建一个sass文件，按照sass的语法写一些样式
function build_sass(){
    return src(app.srcPath + 'sass/*') // 获取sass文件（*.scss）
        .pipe(sass().on('error',sass.logError)) // 执行sass插件，并检查错误
        .pipe(dest(app.distPath + 'css')); // 输出css文件的路径
}
// 压缩css 
function build_css(){
    return src(app.srcPath + 'css/*') // 获取css文件（*.css）
        .pipe(css()) // 执行cleanCSS插件，并检查错误
        .pipe(dest(app.distPath + 'css')); // 输出css文件的路径
}
// 合并压缩代码，src目录下新建文件夹js然后在里面创建几个js文件
 function build_js(){
    return app.model==='dev' ? src(app.srcPath + 'js/*.js') // 获取js文件
        .pipe(dest(app.distPath + 'js')) // 输出合并压缩后的文件路径
        :
        src(app.srcPath + 'js/*.js') // 获取js文件
        //.pipe(concat('main.js')) // 合并文件为main.js
        .pipe(uglify()) // 压缩js代码
        .pipe(dest(app.distPath + 'js')) // 输出合并压缩后的文件路径
}

function build_fonts(){
    return src(app.srcPath + 'fonts/**/*.*').pipe(dest(app.distPath + 'fonts'));
}
function build_skin(){
    return src(app.srcPath + 'skin/**/*.*').pipe(dest(app.distPath + 'skin'));
}
function build_lib(){
    return src(app.srcPath + 'lib/**/*.*').pipe(dest(app.distPath + 'lib'));
}
function build_data(){
    return src(app.srcPath + 'data/**/*.*').pipe(dest(app.distPath + 'data'));
}
function build_template(){
    return src(app.srcPath + 'template/**/*.*').pipe(dest(app.distPath + 'template'));
}
// 监听文件是否发生变化
function build_watch () {
    watch('src/js/*.js',build_js); // 监听src/js/下的所有js文件，如果发生变化则执行任务scripts,下面同理
    watch('src/sass/*',build_sass);
    watch('src/css/*.css',build_css);
    watch('src/*.html',copyHtml);
    watch('src/images/*',build_image);
    watch('src/fonts/*',build_fonts);
    watch('src/skin/*',build_skin);
    watch('src/data/*',build_data);
    watch('src/lib/**/*',build_lib);
    watch('src/template/*',build_template);
}
var dev=[copyHtml,build_image, build_js,build_sass,build_css,build_fonts,build_skin,build_lib,build_data,build_template,build_watch]
var pro=[copyHtml,build_image, build_js,build_sass,build_css,build_fonts,build_skin,build_lib,build_data,build_template,build_watch]
  // 定义默认任务 , 这里的默认任务default不能随便定义 只能是default,后面接受一个数组作为参数，
  //传入默认执行的任务，后面还可以接受一个回调函数用以执行默认任务代码这里就不给做展示了
//exports.build = build;
exports.default = series(dev);
//gulp.task('default',['message','copyHtml','sass','scripts','imageMin','watch']);

