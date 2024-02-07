const path = require('path')
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const Dotenv = require('dotenv-webpack')

module.exports = (env) => {
  return {
    experiments: {
      asyncWebAssembly: true,
    },
    entry: {
      background: './src/app/background.ts',
      contentscript: './src/app/contentscript.ts',
      inpage: './src/app/inpage.ts',
    },
    // mode: 'development',
    mode: 'production',
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'build'),
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new Dotenv({
        path: env.production ? './.env.production' : './.env.development',
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'src/_locales'),
            to: path.resolve(__dirname, 'build/_locales'),
          },
        ],
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'src/app/manifest.json'),
            to: path.resolve(__dirname, 'build'),
          },
        ],
      }),
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      fallback: {
        os: require.resolve('os-browserify/browser'),
        https: require.resolve('https-browserify'),
        http: require.resolve('stream-http'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
      },
    },
  }
}
