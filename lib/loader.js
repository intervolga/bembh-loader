const loaderUtils = require('loader-utils');
const nodeEval = require('node-eval');
const bh = require('bh');
const path = require('path');

/**
 * BemBH loader
 *
 * @param {String|Object} source
 * @return {String|Object}
 */
function bemBHLoader(source) {
  const options = {
    stringify: true,
    levels: [],
    techMap: {},
  };
  Object.assign(options, loaderUtils.getOptions(this));

  const result = typeof source === 'string'
    ? nodeEval(source)
    : source;

  if (!('bemfs' in result)) {
    throw new Error('Wrong argument supplied');
  }

  const engine = new bh.BH;
  engine.setOptions({
    jsAttrName: 'data-bem',
    jsAttrScheme: 'json',
  });

  const templates = result.bemfs.filter((fileName) => {
    return /\.bh\.js$/i.test(fileName);
  });
  templates.forEach((file) => {
    let templatePath;
    try {
      templatePath = path.resolve(file);
      delete require.cache[templatePath];
    } catch (e) {
      throw new Error('Template file not found ' + file);
    }

    try {
      require(templatePath)(engine);
    } catch (e) {
      throw new Error('Error processing BH template ' + file);
    }
  });

  const html = engine.apply(result.bemjson);
  const newName = path.basename(this.resourcePath)
    .replace('.bemjson.js', '.html');
  this.emitFile(newName, html);

  result.bemfs = result.bemfs.filter((fileName) => {
    return !(/\.bh\.js$/i.test(fileName));
  });

  if (options.stringify) {
    return 'module.exports = ' + JSON.stringify(result) + ';';
  } else {
    return result;
  }
}

module.exports = bemBHLoader;
