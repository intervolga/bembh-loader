const loaderUtils = require('loader-utils');
const nodeEval = require('node-eval');
const path = require('path');
const beautifyHtml = require('js-beautify').html;

/**
 * BemBH loader
 *
 * @param {String} source
 */
function bemBHLoader(source) {
  const options = {
    beautify: true,
    name: '[name].html',
    client: false, // or true or 'static'
    bhFilename: require.resolve('bh'),
    bhOptions: {
      jsAttrName: 'data-bem',
      jsAttrScheme: 'json',
      xhtml: false,
    },
  };
  Object.assign(options, loaderUtils.getOptions(this));

  const self = this;
  let bemFS = nodeEval(source);

  // Extract templates
  const bhTemplates = bemFS.filter((fileName) => {
    return /\.bh\.js$/i.test(fileName);
  }).map((fileName) => {
    return path.resolve(fileName);
  });

  // Prepare BH engine
  const engine = new (require(options.bhFilename)).BH;
  engine.setOptions(options.bhOptions);

  // Apply templates to engine
  bhTemplates.forEach((fileName) => {
    try {
      delete require.cache[fileName];
    } catch (e) {
      throw new Error('Template file not found ' + fileName);
    }

    try {
      require(fileName)(engine);
      self.addDependency(fileName);
    } catch (e) {
      throw new Error('Error processing BH template ' + fileName);
    }
  });

  // Load BemJson and transform with BH engine
  const callback = this.async();
  const request = '!@intervolga/eval-loader!' + this.resourcePath;
  this.loadModule(request, (err, source) => {
    if (err) {
      callback(err);
      return;
    }

    const bemJson = nodeEval(source);
    // TODO: replace images,
    // maybe https://github.com/webpack-contrib/html-loader

    let html;
    try {
      html = engine.apply(bemJson);
    } catch (e) {
      callback(e);
      return;
    }

    if (options.beautify) {
      html = beautifyHtml(html, {});
      // .replace(/\s*\/\* beautify preserve:start \*\//g, '')
      // .replace(/\/\* beautify preserve:end \*\/\s*/g, '');
    }

    const newName = loaderUtils.interpolateName(this, options.name, {
      content: html,
    });
    self.emitFile(newName, html);

    // Remove BH templates from pipe
    bemFS = bemFS.filter((fileName) => {
      return !(/\.bh\.js$/i.test(fileName));
    }).map((fileName) => {
      return {'require': fileName};
    });

    if (options.client) {
      const bhClientTemplates = bhTemplates.map((fileName) => {
        let safeTemplate = loaderUtils.stringifyRequest(self, fileName);
        return `window.matches[${safeTemplate}] = ' +
          'window.matches[${safeTemplate}] || ' +
          'require(${safeTemplate})(bh) || true;`;
      }).join('\n');
      const bhClientSource = `
        window.initMatches = window.initMatches ? window.initMatches : [];
        window.initMatches.push(function (bh) {
        window.matches = window.matches ? window.matches : [];
          ${bhClientTemplates}
      });`;
      bemFS.splice(0, 0, {'raw': bhClientSource});
    }

    callback(null, 'module.exports = ' + JSON.stringify(bemFS) + ';');
  });
}

module.exports = bemBHLoader;
