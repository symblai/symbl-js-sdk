var path = require('path');
var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');
var directory = __dirname + '/..';

var nodeConfig = {
    target: 'node',
    //externals: [nodeExternals()],
    externals: {
        'websocket': 'websocket',
        'formidable': 'formidable'
    },
    entry: './src/index.js',
    resolve: {
        modules: ['node_modules/@rammerai/api-client/src', 'node_modules']
    },
    output: {
        path: path.resolve(directory, 'build'),
        filename: 'app.bundle.js',
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['es2015']
                        }
                    }],
            }
        ]
    },
    stats: {
        colors: true
    }
};

var browserConfig = {
    target: 'web',
    entry: './src/index.js',
    resolve: {
        modules: ['node_modules/@rammerai/api-client/src', 'node_modules']
    },
    output: {
        path: path.resolve(directory, 'build'),
        filename: 'client.sdk.min.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['es2015']
                        }
                    }],
            }
        ]
    },
    stats: {
        colors: true
    }
};


module.exports = [nodeConfig, browserConfig];
