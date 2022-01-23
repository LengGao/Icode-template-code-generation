loder.editError
插件导入位置不对：
    vue-loader的插件在vue-loader/lib/plugin
改webpack.config.js


TypeError: Cannot read property ‘parseComponent‘ of undefined
vue版本和vue-template-compiler版本不一致导致：
    升级 @vue/component-compiler-utils 或 "vue-template-compiler": "2.6.11" || "latest"
vue3不用vue-template-compiler了，用的@vue/compiler-sfc，注意目前安装vue-loader要指定16以上的版本，默认安装的最新版本不行的