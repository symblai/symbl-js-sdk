var path = require('path');
var directory = __dirname + '/..';

// Version for Node that uses websocket package and builds to a umd style package.
var nodeConfig = {
    target: 'node',
    externals: {
        'websocket': 'websocket',
        'formidable': 'formidable'
    },
    entry: './dist/index.js',
    resolve: {
        modules: ['node_modules/@symblai/api-client/src', 'node_modules']
    },
    output: {
        path: path.resolve(directory, 'build'),
        filename: 'app.bundle.js',
        libraryTarget: 'umd',
        library: 'sdk'
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

// Version for browser that builds for a simple browser script src or import into Web SDK
var browserConfig = {
    target: 'web',
    entry: './dist/index.js',
    resolve: {
        modules: ['node_modules/@symblai/api-client/src', 'node_modules']
    },
    output: {
        path: path.resolve(directory, 'build'),
        filename: 'client.sdk.min.js',
        libraryTarget: 'commonjs2',
        library: 'symbl'
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
