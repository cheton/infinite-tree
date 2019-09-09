const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const pkg = require('./package.json');
const banner = pkg.name + ' v' + pkg.version + ' | (c) ' + new Date().getFullYear() + ' ' + pkg.author + ' | ' + pkg.license + ' | ' + pkg.homepage;
const env = process.env;
const plugins = [
    new webpack.BannerPlugin(banner)
];

const USE_TERSER_PLUGIN = (env.BUILD_ENV === 'dist');

module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, 'lib/index.js'),
    output: {
        path: path.join(__dirname, 'dist'),
        filename: env.BUILD_ENV === 'dist' ? 'infinite-tree.min.js' : 'infinite-tree.js',
        libraryTarget: 'umd',
        library: 'InfiniteTree'
    },
    optimization: {
        minimizer: [
            USE_TERSER_PLUGIN && (
                new TerserPlugin()
            )
        ].filter(Boolean)
    },
    plugins: plugins,
};
