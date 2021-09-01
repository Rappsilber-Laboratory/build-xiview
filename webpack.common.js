require("webpack");
const path = require("path");


module.exports = {
    // entry: "./xi3/js/main.js",
    // output: {
    //     path: path.resolve(__dirname, "dist"),
    //     filename: "xiview.js",
    //     library: ["xiview"],
    //     libraryTarget: "umd"
    // },

    entry: {
        xiview: './xi3/js/main.js',
        // aligner: './xi3/js/align/alignWorker.js',
    },
    output: {
        filename: '[name].js',
        path: __dirname + '/dist',
        library: ['[name]'],
        libraryTarget: "umd"
    },

    module: {
        rules: [
            {
                test: /\.css$/i,
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
    devServer: {
        contentBase: path.join(__dirname),
        compress: true,
        port: 9000
    }
};
