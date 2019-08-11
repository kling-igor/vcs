import HTMLWebpackPlugin from 'html-webpack-plugin'
import { join } from 'path'

module.exports = env => ({
  entry: join(__dirname, 'index.js'),
  output: {
    filename: 'bundle.js',
    path: join(__dirname, '../app')
  },

  // target: 'electron-renderer',

  watch: false,

  node: {
    fs: 'empty'
  },

  watchOptions: {
    aggregateTimeout: 100
  },

  devtool: env.dev ? 'source-map' : false,

  resolve: {
    modules: [__dirname]
  },

  plugins: [
    new HTMLWebpackPlugin({
      filename: 'index.html',
      template: join(__dirname, 'index.html'),
      inject: 'body',
      hash: false
    })
  ],

  module: {
    rules: [
      {
        test: /.jsx?$/,
        include: [__dirname],
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx', '.css']
  }
})
