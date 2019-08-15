import HTMLWebpackPlugin from 'html-webpack-plugin'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'
import MomentLocalesPlugin from 'moment-locales-webpack-plugin'
import { resolve, join } from 'path'

const MONACO_DIR = resolve(__dirname, './node_modules/monaco-editor')
const BLUEPRINT_DIR = resolve(__dirname, './node_modules/@blueprintjs')

module.exports = env => ({
  entry: join(__dirname, 'index.js'),
  output: {
    filename: 'bundle.js',
    path: join(__dirname, '../app'),
    globalObject: 'this'
  },

  devServer: {
    port: 8080,
    host: '0.0.0.0',
    hot: true
  },

  // target: 'electron-renderer',

  watch: true,

  watchOptions: {
    aggregateTimeout: 100
  },

  node: {
    fs: 'empty',
    __dirname: false
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
    }),

    new MonacoWebpackPlugin({
      // available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
      languages: ['json', 'javascript', 'typescript'],
      features: [
        '!contextmenu',
        '!coreCommands',
        '!inspectTokens',
        '!iPadShowKeyboard',
        '!quickCommand'
        // "!quickOutline"
      ]
    }),

    // To strip all locales except “en”
    new MomentLocalesPlugin()
  ],

  module: {
    rules: [
      {
        test: /.jsx?$/,
        exclude: /node_modules\/(?![react\-monaco\-editor]\/).*/,
        include: [__dirname],
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.worker\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'worker-loader'
        }
      },
      {
        test: /\.css$/,
        include: MONACO_DIR,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.css$/,
        include: BLUEPRINT_DIR,
        use: ['style-loader', 'css-loader']
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
