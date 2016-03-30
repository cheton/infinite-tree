/* eslint no-var: 0 */
var path = require('path');
var webpack = require('webpack');

module.exports = {
    cache: true,
    debug: true,
    devtool: 'eval',
    entry: path.resolve('index.js'),
    output: {
        path: path.join(__dirname),
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loader: 'babel',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'stage-0']
                }
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({ minimize: true })
    ]
};
