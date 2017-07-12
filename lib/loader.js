const loaderUtils = require('loader-utils');
const nodeEval = require('node-eval');
const bh = require('bh');
const path = require('path');
const beautifyHtml = require('js-beautify').html;
// const walkBemJson = require('./walk-bemjson');

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
    name: '[name].html',
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

  const self = this;
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
      self.addDependency(templatePath);
    } catch (e) {
      throw new Error('Error processing BH template ' + file);
    }
  });

  // BH.apply can modify original bemjson, making clone
  let bemjson = JSON.parse(JSON.stringify(result.bemjson));
  // bemjson = walkBemJson(bemjson, (val) => {
  //   return val;
  // });
  let html = engine.apply(bemjson);

  if (options.beautify) {
    html = beautifyHtml(html, {});
      // .replace(/\s*\/\* beautify preserve:start \*\//g, '')
      // .replace(/\/\* beautify preserve:end \*\/\s*/g, '');
  }
  // TODO: https://github.com/webpack-contrib/html-loader

  const newName = loaderUtils.interpolateName(this, options.name, {
    content: html,
  });
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
