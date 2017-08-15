const loaderUtils = require('loader-utils');
const nodeEval = require('node-eval');
const bh = require('bh');
const path = require('path');
const beautifyHtml = require('js-beautify').html;
// const walkBemJson = require('./walk-bemjson');

/**
 * BemBH loader
 *
 * @param {String} source
 */
function bemBHLoader(source) {
  const options = {
    beautify: true,
    name: '[name].html',
    bhOptions: {
      jsAttrName: 'data-bem',
      jsAttrScheme: 'json',
      xhtml: false,
    },
  };
  Object.assign(options, loaderUtils.getOptions(this));

  const self = this;
  let bemFS = nodeEval(source);

  // Prepare BH engine
  const engine = new bh.BH;
  engine.setOptions(options.bhOptions);
  bemFS.filter((fileName) => {
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

  const callback = this.async();
  const request = '!@intervolga/eval-loader!' + this.resourcePath;
  this.loadModule(request, (err, source) => {
    if (err) {
      callback(err);
      return;
    }

    const bemJson = nodeEval(source);
    let html = engine.apply(bemJson);

    if (options.beautify) {
      html = beautifyHtml(html, {});
      // .replace(/\s*\/\* beautify preserve:start \*\//g, '')
      // .replace(/\/\* beautify preserve:end \*\/\s*/g, '');
    }
    // TODO: https://github.com/webpack-contrib/html-loader

    const newName = loaderUtils.interpolateName(this, options.name, {
      content: html,
    });
    self.emitFile(newName, html);

    bemFS = bemFS.filter((fileName) => {
      return !(/\.bh\.js$/i.test(fileName));
    });

    callback(null, 'module.exports = ' + JSON.stringify(bemFS) + ';');
  });
}

module.exports = bemBHLoader;
