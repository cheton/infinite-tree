var path = require('path');
var webpack = require('webpack');
var pkg = require('./package.json');
var banner = pkg.name + ' v' + pkg.version + ' | (c) ' + new Date().getFullYear() + ' ' + pkg.author + ' | ' + pkg.license + ' | ' + pkg.homepage;
var env = process.env.BUILD_ENV;
var plugins = [
    new webpack.BannerPlugin(banner)
];

if (env === 'dist') {
    plugins = plugins.concat([
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            mangle: false
        })
    ]);
}

module.exports = {
    entry: path.resolve(__dirname, 'lib/index.js'),
    output: {
        path: path.join(__dirname, 'dist'),
        filename: env === 'dist' ? 'infinite-tree.min.js' : 'infinite-tree.js',
        libraryTarget: 'umd',
        library: 'InfiniteTree'
    },
    plugins: plugins
};
