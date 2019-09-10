const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const babelConfig = require('../babel.config');

const USE_TERSER_PLUGIN = (process.env !== 'development');

const webpackConfig = {
    mode: process.env.NODE_ENV,
    devtool: (process.env.NODE_ENV === 'development') ? 'eval' : 'source-map',
    entry: {
        navbar: path.resolve(__dirname, 'navbar.js'),
        examples: path.resolve(__dirname, 'examples.js')
    },
    output: {
        path: path.join(__dirname, '../docs'),
        filename: '[name].js'
    },
    optimization: {
        minimizer: [
            USE_TERSER_PLUGIN && (
                new TerserPlugin()
            )
        ].filter(Boolean)
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                options: babelConfig,
                exclude: /node_modules/
            },
            {
                test: /\.styl$/,
                loader: 'style-loader!css-loader!stylus-loader'
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.(png|jpg)$/,
                loader: 'url-loader',
                query: {
                    limit: 8192
                }
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'url-loader',
                query: {
                    limit: 10000,
                    mimetype: 'application/font-woff'
                }
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'file-loader'
            }
        ]
    },
    // https://webpack.github.io/docs/webpack-dev-server.html#additional-configuration-options
    devServer: {
        disableHostCheck: true,
        noInfo: false,
        lazy: false,
        // https://webpack.github.io/docs/node.js-api.html#compiler
        watchOptions: {
            poll: true // use polling instead of native watchers
        }
    }
};

module.exports = webpackConfig;
