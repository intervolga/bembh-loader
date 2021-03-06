const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const generateConfig = require('./generate-config');
const requireNoCache = require('./require-no-cache');

module.exports = (entry, cb) => {
  const config = generateConfig(entry);
  const compiler = webpack(config);

  const watching = compiler.watch({
    /* watchOptions */
  }, (err, stats) => {
    const we = err ||
      (stats.hasErrors() && stats.compilation.errors[0]) ||
      (stats.hasWarnings() && stats.compilation.warnings[0]);

    if (we) {
      cb(we);
      watching.close();

      return;
    }

    try {
      let bundlePath = path.join(config.output.path, config.output.filename);
      const result = requireNoCache(bundlePath);

      let resultPath = path.join(config.output.path, 'produced.bemjson.json');
      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));

      cb(result);
    } catch (e) {
      cb(e);
      watching.close();
    }
  });

  return watching;
};
