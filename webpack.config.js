// Define API's host URL - dev or production
var path = require('path');
var webpack = require('webpack');

module.exports = {
    context: __dirname,

    entry: {
        scorecard: './src/public/javascript/scorecard.js'
    },

    output: {
        path: path.resolve('./src/public/assets/'),
        filename: '[name].js',
    },

    plugins: [
        // new BundleTracker({filename: './webpack-stats.json'}),
        // new webpack.DefinePlugin({
        //     __API_URL__: hostAPI(process.env.NODE_ENV)
        // }),
        // new webpack.ProvidePlugin({
        //     'Promise': 'es6-promise'
        // })
    ],

    module: {
        // loaders: [ {
        //         test: /\.js$/,
        //         loader: 'babel-loader',
        //         exclude: /node_modules/,
        //     },
        // ],
    }
}
