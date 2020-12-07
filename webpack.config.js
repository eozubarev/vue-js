const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const SpriteLoaderPlugin = require("svg-sprite-loader/plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = (env, argv) => {
  const isProductionBuild = argv.mode === "production";
  const publicPath = "/";

  const pcss = {
    test: /\.(p|post|)css$/,
    use: [
      isProductionBuild ? MiniCssExtractPlugin.loader : "vue-style-loader",
      "css-loader",
      "postcss-loader",
    ],
  };

  const vue = {
    test: /\.vue$/,
    loader: "vue-loader",
  };

  const js = {
    test: /\.js$/,
    loader: "babel-loader",
    exclude: /node_modules/,
    options: {
      presets: ["@babel/preset-env"],
      plugins: ["@babel/plugin-syntax-dynamic-import"],
    },
  };

  const files = {
    test: /\.(png|jpe?g|gif|woff2?)$/i,
    loader: "file-loader",
    options: {
      name: "[hash].[ext]",
    },
  };

  const svg = {
    test: /\.svg$/,
    use: [
      {
        loader: "svg-sprite-loader",
        options: {
          extract: true,
          spriteFilename: (svgPath) => `sprite${svgPath.substr(-4)}`,
        },
      },
      "svg-transform-loader",
      {
        loader: "svgo-loader",
        options: {
          plugins: [
            { removeTitle: true },
            {
              removeAttrs: {
                attrs: "(fill|stroke)",
              },
            },
          ],
        },
      },
    ],
  };

  const pug = {
    test: /\.pug$/,
    oneOf: [
      {
        resourceQuery: /^\?vue/,
        use: ["pug-plain-loader"],
      },
      {
        use: ["pug-loader"],
      },
    ],
  };

  const config = {
    entry: {
      main: "./src/main.js",
      admin: "./src/admin/main.js",
    },
    output: {
      path: path.resolve(__dirname, "./dist"),
      filename: "[name].[hash].build.js",
      publicPath: isProductionBuild ? publicPath : "",
      chunkFilename: "[chunkhash].js",
    },
    module: {
      rules: [pcss, vue, js, files, svg, pug],
    },
    resolve: {
      alias: {
        vue$: "vue/dist/vue.esm.js", // Если пишем импорт import "anyname"  тогда это будет считаться пакетом npm и вебпак постарается подключить из папки node_modules
        images: path.resolve(__dirname, "./src/images"), // Для картинок, чтобы каждый раз не указываться путь до картинок 
        components: path.resolve(__dirname, "./src/admin/components"),
        styles: path.resolve(__dirname, "./src/styles"),
      },
      extensions: ["*", ".js", ".vue", ".json"],
    },
    devServer: {
      historyApiFallback: true, // Исп. при разработки SPA все ненайденые маршруты будут вести на страницу index.html
      noInfo: false, // Уведомлять в консоли о положительных или отрицательных действиях, что было пересобрано или вывели ошибки 
      overlay: true, // Указывает что если будет какая-то ошибка, то devServer прямо на страничке отобразит ошибку, поверх вёрстки
    },
    performance: {
      hints: false, // Подсказки вебпака или уведомления(следует сжать какой-то файл и тд)
    },
    plugins: [
      new HtmlWebpackPlugin({ // Секция плагион, как и люб. сборщик вебпак поддерживает различные плагины
        template: "src/index.pug", // Подключение HTML вебпак, плагина
        chunks: ["main"],
      }),
      new HtmlWebpackPlugin({
        template: "src/admin/index.pug",
        filename: "admin/index.html",
        chunks: ["admin"],
      }),
      new SpriteLoaderPlugin({ plainSprite: true }),
      new VueLoaderPlugin(), // Требует сам vueloader, работает по такой схеме
    ],
    devtool: "#eval-source-map", // генерирует подробные sourceMap, чтобы могли лучше находить ошибки и смотреть где какие уведомления выдал код
  };
  // При запуске вебпака мы можем передать параметр в котором укажем с какой версией мы сейчас работает dev или production
  // В dev версии нас интересуют sourceMap чтоб мы знали где какие ошибки и тд и не интересует оптимизация кода
  // Когда ходим проект выложить в production тогда нам не нужны не какие sourceMap и чтобы всё было сжато 
  if (isProductionBuild) {
    config.devtool = "none";
    config.plugins = (config.plugins || []).concat([
      new CleanWebpackPlugin(),
      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: '"production"',
        },
      }),
      new MiniCssExtractPlugin({
        filename: "[name].[contenthash].css",
        chunkFilename: "[contenthash].css",
      }),
    ]);

    config.optimization = {};

    config.optimization.minimizer = [
      new TerserPlugin({ // Сжимает JS код, Terser плагин
        cache: true,
        parallel: true,
        sourceMap: false,
      }),
      new OptimizeCSSAssetsPlugin({}), // Сожмёт css которые мы экспортировали в файлы
    ];
  }

  return config;
};
