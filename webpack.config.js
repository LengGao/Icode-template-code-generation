// import {Configuration} from 'webpack'
// import {DevServerConfiguration} from 'webpack-dev-server'
// 启动时注释

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin')

/**
 * @type DevServerConfiguration
 */
 const devConfig = {
    static: {directory: path.join(__dirname, 'public')},
    server: 'http',
    host: '0.0.0.0',
    port: 9000,
    compress: true,
    hot: true,
    setupExitSignals: true,
    webSocketServer: false,
    client: {
        logging: 'none',
        overlay: false,
        progress: false,
        reconnect: false
    }
}

/**
 * @type Configuration
 */
const wbpConfig = {
    entry: './src/index.js',
    output: {
        filename: '[name].bundle.js',
        path: path.join(__dirname, 'dist'),
        clean: true
    },
    module: {
        rules: [
            {test: /\.vue$/, use: 'vue-loader', include: path.join(__dirname, 'src')},
            {test: /\.js$/, use: 'babel-loader', include: path.join(__dirname, 'src')},
            {test: /\.css$/, use: ['vue-style-loader','css-loader'], include: path.join(__dirname, 'src')}
        ]
    },
    plugins: [
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({title: 'TemplateCodeGeneration', template: 'index.html'})
    ],
    devtool: 'inline-source-map',
    devServer: devConfig,
    performance: {hints: false},
    mode: 'development'
}

module.exports = wbpConfig