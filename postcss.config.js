const fs = require("fs");

module.exports = {
  syntax: "postcss-scss",
  parser: "postcss-scss",
  plugins: [
    require("postcss-easy-import")({
      extensions: ".pcss",
    }),
    require("autoprefixer")({
      browsers: ["last 2 versions"],
      cascade: false
    }),
    require("postcss-each"),
    require("postcss-advanced-variables")({
      variables: JSON.parse(
        fs.readFileSync("./src/styles/variables.json", "utf-8")
      ),
    }),
    require("postcss-nested"),
    require("postcss-rgb"),
    require("postcss-inline-svg")({
      removeFill: true,
      paths: ["./src/images/icons"],
    }),
    require("cssnano"),
    require("postcss-pxtorem")({ //Переводит все изменения из px в rem , удобно для адаптива
      rootValue: 16,
      propList: ["*", "!*border*"],
      selectorBlackList: [/^html$/], // Чтобы значение осталось в px, нужно написать Px || PX
    }),
  ],
};
