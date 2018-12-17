// webpack.config.js
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'build/kraken-fees-calculator.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      }
    ]
  }
};