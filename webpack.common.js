require("webpack");
const path = require("path");


module.exports = {
    entry: {
        xiview: "./xiview/js/main.js",
    },
    output: {
        filename: "[name].js",
        path: __dirname + "/dist",
        library: ["[name]"],
        libraryTarget: "umd",
    },

    module: {
        rules: [
            {
                test: /\.(css|scss)$/i,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
                loader: "url-loader",
                // options: {
                //     limit: 8192,
                // },
            }
        ]
    },
    optimization: {
        splitChunks: {
            // include all types of chunks
            // chunks: 'all',
            cacheGroups: {
                commons: {
                    name: "commons",
                    chunks: "initial",
                    minChunks: 2,
                },
            },
        },
    },
    plugins: [
        // not working because has outdated webpack dependency
        /* Use the ProvidePlugin constructor to inject jquery implicit globals */
        // new webpack.ProvidePlugin({
        //     $: "jquery",
        //     jQuery: "jquery",
        //     "window.jQuery": "jquery'",
        //     "window.$": "jquery"
        // })
    ]
};
