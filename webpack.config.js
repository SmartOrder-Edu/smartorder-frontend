const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production'

  return {
    entry: './src/main.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
      chunkFilename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
      clean: true,
      publicPath: '/'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/views': path.resolve(__dirname, 'src/views'),
        '@/api': path.resolve(__dirname, 'src/api'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/stores': path.resolve(__dirname, 'src/stores'),
        '@/types': path.resolve(__dirname, 'src/types'),
        '@/assets': path.resolve(__dirname, 'src/assets'),
        '@/router': path.resolve(__dirname, 'src/router'),
        '@/composables': path.resolve(__dirname, 'src/composables'),
        '@/directives': path.resolve(__dirname, 'src/directives'),
        '@/layouts': path.resolve(__dirname, 'src/layouts')
      }
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: 'vue-loader'
        },
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: !isProduction,
                appendTsSuffixTo: [/\.vue$/],
                compilerOptions: {
                  isCustomElement: (tag) => tag.startsWith('x-')
                }
              }
            }
          ],
          exclude: /node_modules/
        },
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.(s[ac]ss|css)$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: {
                  auto: (resourcePath) => resourcePath.endsWith('.module.scss'),
                  localIdentName: isProduction
                    ? '[hash:base64:8]'
                    : '[path][name]__[local]--[hash:base64:5]'
                },
                importLoaders: 2
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [require('autoprefixer')()]
                }
              }
            },
            'sass-loader'
          ]
        },
        {
          test: /\.(png|jpe?g|gif|webp|avif)(\?.*)?$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10 * 1024
            }
          },
          generator: {
            filename: 'images/[name].[hash:8][ext]'
          }
        },
        {
          test: /\.(svg)(\?.*)?$/,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name].[hash:8][ext]'
          }
        },
        {
          test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
          type: 'asset/resource',
          generator: {
            filename: 'media/[name].[hash:8][ext]'
          }
        },
        {
          test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash:8][ext]'
          }
        }
      ]
    },
    plugins: [
      new VueLoaderPlugin(),
      new HtmlWebpackPlugin({
        template: './public/index.html',
        title: 'Vue 3 + TypeScript + Webpack',
        favicon: './public/favicon.ico',
        minify: isProduction
          ? {
              removeComments: true,
              collapseWhitespace: true,
              removeAttributeQuotes: true,
              minifyJS: true,
              minifyCSS: true
            }
          : false
      }),
      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: 'css/[name].[contenthash:8].css',
              chunkFilename: 'css/[name].[contenthash:8].css'
            })
          ]
        : [])
    ],
    optimization: {
      minimize: isProduction,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10
          },
          vue: {
            test: /[\\/]node_modules[\\/](vue|@vue|pinia|vue-router)[\\/]/,
            name: 'vue',
            priority: 20
          },
          element: {
            test: /[\\/]node_modules[\\/]element-plus[\\/]/,
            name: 'element-plus',
            priority: 15
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true
          }
        }
      },
      runtimeChunk: {
        name: 'runtime'
      }
    },
    devServer: {
      historyApiFallback: true,
      hot: true,
      open: false,
      compress: true,
      client: {
        overlay: {
          errors: true,
          warnings: false,
          runtimeErrors: (error) => {
            // 忽略 ResizeObserver 警告（Element Plus 等库的已知问题，无害）
            if (error.message.includes('ResizeObserver loop')) {
              return false
            }
            return true
          }
        },
        progress: true
      },
      static: {
        directory: path.join(__dirname, 'public')
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          pathRewrite: {
            '^/api': ''
          }
        }
      }
    },
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename]
      }
    },
    stats: isProduction ? 'normal' : 'minimal'
  }
}
