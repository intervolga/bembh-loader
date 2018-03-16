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
      // Stringify engine path and options
      const bhClientEngine = loaderUtils.stringifyRequest(
        self, options.bhFilename);
      const bhClientOptions = JSON.stringify(options.bhOptions);

      let bhClientSource;
      if (options.client == 'static') {
        // Stringify templates
        const bhClientTemplates = bhTemplates.map((fileName) => {
          let safeTemplate = loaderUtils.stringifyRequest(self, fileName);
          return `require(${safeTemplate})(BH);`;
        }).join('\n');


        // Static BH for client
        bhClientSource = `
          (function(){
            const BH = new (require(${bhClientEngine})).BH;
            BH.setOptions(${bhClientOptions});
            ${bhClientTemplates}
    
            window.getBH = (cb) => {
              cb(BH);
            };
          })();`;
      } else {
        const bhClientTemplates = bhTemplates.map((fileName) => {
          let safeTemplate = loaderUtils.stringifyRequest(self, fileName);
          return `import(${safeTemplate})`;
        }).join(', ');

        bhClientSource = `
          window.getBH = (cb) => {
            const requireBH = import(${bhClientEngine})
              .then((bhModule) => {
                const BH = new bhModule.BH;
                BH.setOptions(${bhClientOptions});
                return BH;
              });
            
            const requireTemplates = [${bhClientTemplates}];
          
            Promise.all([
              requireBH,
              Promise.all(requireTemplates)
            ]).then((results) => {
              const BH = results[0];
              const templates = results[1];
          
              templates.forEach((template) => {
                template.default(BH);
              });
          
              cb(BH);
            });
          };`;
      }

      bemFS.splice(0, 0, {'raw': bhClientSource});
    }

    callback(null, 'module.exports = ' + JSON.stringify(bemFS) + ';');
  });
}

module.exports = bemBHLoader;
