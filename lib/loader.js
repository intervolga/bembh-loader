const loaderUtils = require('loader-utils');
const nodeEval = require('node-eval');
const bh = require('bh');
const path = require('path');
const beautifyHtml = require('js-beautify').html;

/**
 * BemBH loader
 *
 * @param {String|Object} source
 * @return {String|Object}
 */
function bemBHLoader(source) {
  const options = {
    beautify: true,
    stringify: true,
    bhOptions: {
      jsAttrName: 'data-bem',
      jsAttrScheme: 'json',
      xhtml: false,
    },
  };
  Object.assign(options, loaderUtils.getOptions(this));

  const result = typeof source === 'string'
    ? nodeEval(source)
    : source;

  if (!('bemfs' in result)) {
    throw new Error('Wrong argument supplied');
  }

  const engine = new bh.BH;
  engine.setOptions(options.bhOptions);

  result.bemfs.filter((fileName) => {
    return /\.bh\.js$/i.test(fileName);
  }).forEach((file) => {
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

  // BH.apply can modify original bemjson, making clone
  const bemjson = JSON.parse(JSON.stringify(result.bemjson));
  let html = engine.apply(bemjson);

  if (options.beautify) {
    html = beautifyHtml(html, {});
      // .replace(/\s*\/\* beautify preserve:start \*\//g, '')
      // .replace(/\/\* beautify preserve:end \*\/\s*/g, '');
  }

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
