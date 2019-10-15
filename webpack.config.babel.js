const webpack = require('webpack')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

// const { readdirSync } = require('fs')
const { resolve, join } = require('path')

const APP_DIR = resolve(__dirname, './src')
const MONACO_DIR = resolve(__dirname, './node_modules/monaco-editor')
const BLUEPRINT_DIR = resolve(__dirname, './node_modules/@blueprintjs')

// const platformModulesFolder = join('node_modules', '@platform')
// const platformModules = readdirSync(resolve(__dirname, platformModulesFolder)).map(dir =>
//   resolve(platformModulesFolder, dir, 'src')
// )

module.exports = env => ({
  target: 'electron-renderer',

  entry: join(__dirname, 'src', 'renderer', 'index.js'),

  output: {
    filename: 'bundle.js',
    path: join(__dirname, 'app'),
    globalObject: 'this'
  },

  watch: !!env.dev,

  node: {
    fs: 'empty',
    __dirname: false
  },

  devtool: env.dev ? 'inline-source-map' : false,

  resolve: {
    modules: [join(__dirname, '.'), join(__dirname, 'src', 'renderer'), join(__dirname, 'src', 'common')]
  },

  plugins: [
    new HTMLWebpackPlugin({
      filename: 'index.html',
      template: join(__dirname, 'src', 'renderer', 'index.html'),
      inject: 'body',
      hash: false
    }),

    new webpack.ProvidePlugin({
      vision: [join(__dirname, 'src', 'renderer', 'environment'), 'default']
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
    })
  ],

  module: {
    rules: [
      {
        test: /.jsx?$/,
        exclude: /node_modules\/(?![react\-monaco\-editor]\/).*/,
        include: [join(__dirname, 'src', 'renderer'), join(__dirname, 'src', 'common')],
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
        include: APP_DIR,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.css$/,
        include: BLUEPRINT_DIR,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader']
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx', '.css']
  }
})
