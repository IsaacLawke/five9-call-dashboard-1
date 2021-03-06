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
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                // options: {
                //     loaders: {
                //         {{#sass}}
                //         // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
                //         // the "scss" and "sass" values for the lang attribute to the right configs here.
                //         // other preprocessors should work out of the box, no loader config like this necessary.
                //         'scss': [
                //             'vue-style-loader',
                //             'css-loader',
                //             'sass-loader'
                //         ],
                //         'sass': [
                //             'vue-style-loader',
                //             'css-loader',
                //             'sass-loader?indentedSyntax'
                //         ]
                //         {{/sass}}
                //     }
                //     // other vue-loader options go here
                // }
            }
        ],
    }
}
