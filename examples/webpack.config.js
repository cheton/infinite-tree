/* eslint no-var: 0 */
var path = require('path');
var webpack = require('webpack');
var nib = require('nib');
var stylusLoader = require('stylus-loader');

const webpackConfig = {
    entry: {
        navbar: path.resolve(__dirname, 'navbar.js'),
        examples: path.resolve(__dirname, 'examples.js')
    },
    output: {
        path: path.join(__dirname, '../docs'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
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
    plugins: [
        new webpack.LoaderOptionsPlugin({
            debug: true
        }),
        new stylusLoader.OptionsPlugin({
            default: {
                // nib - CSS3 extensions for Stylus
                use: [nib()],
                // no need to have a '@import "nib"' in the stylesheet
                import: ['~nib/lib/nib/index.styl']
            }
        }),
        new webpack.optimize.CommonsChunkPlugin('../docs/common')
    ],
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

if (process.env.NODE_ENV === 'development') {
    webpackConfig.devtool = 'eval';
} else {
    webpackConfig.devtool = 'source-map';
    webpackConfig.plugins.push(
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            mangle: false
        })
    );
}

module.exports = webpackConfig;
