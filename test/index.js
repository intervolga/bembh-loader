const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const expect = require('expect.js');
const runWebpack = require('./helpers/run-webpack');
const watchWebpack = require('./helpers/watch-webpack');


describe('bembh-loader', () => {
  it('should pass normal bemjson', () => {
    const paths = getCasePaths('normal-bemjson');

    return runWebpack(paths.source).then((result) => {
      expect(result).to.eql(require(paths.expected));

      const producedHtml = fs.readFileSync(paths.out_produced).toString();
      const expectedHtml = fs.readFileSync(paths.out_expected).toString();
      expect(producedHtml).to.eql(expectedHtml);
    });
  });

  it('should not fail incorrect bemjson', () => {
    const paths = getCasePaths('incorrect-bemjson');

    return runWebpack(paths.source).then((result) => {
      expect(result).to.eql(require(paths.expected));
    });
  });

  it('should fail with incorrect bh template', () => {
    const paths = getCasePaths('incorrect-block-bh');

    return runWebpack(paths.source).then(() => {
      // This test case should not be success
      expect().fail();
    }).catch((err) => {
      let message = err.toString();
      expect(message).to.contain('blocks.project/wrong/wrong.bh.js');
    });
  });

  it('should invalidate cache when template added', function(done) {
    this.timeout(30000); // eslint-disable-line no-invalid-this

    const paths = getCasePaths('bemjson-template-add');

    const source = path.join(__dirname, 'levels', 'blocks.common',
      'add-template', 'add-template.bh.js');
    const changed = path.join(__dirname, 'levels', 'blocks.common',
      'add-template', 'add-template_original.bh.js');

    fse.copySync(changed, source);
    fse.removeSync(source);

    let firstRun = false;
    let firstTimerId = null;
    let secondRun = false;
    let watching;
    const cb = (result) => {
      expect(typeof result).to.be.a('string');

      if (!firstRun) {
        if (firstTimerId) {
          clearTimeout(firstTimerId);
        }

        firstTimerId = setTimeout(() => {
          firstRun = true;
          fse.copySync(changed, source);
        }, 5000);
      } else if (!secondRun) {
        secondRun = true;
        setTimeout(() => {
          watching && watching.close();
          expect(result).to.eql(require(paths.expected));

          const producedHtml = fs.readFileSync(paths.out_produced).toString();
          const expectedHtml = fs.readFileSync(paths.out_expected).toString();
          expect(producedHtml).to.eql(expectedHtml);

          done();
        }, 5000);
      }
    };

    watching = watchWebpack(paths.source, cb);
  });

  it('should invalidate cache when template removed', function(done) {
    this.timeout(30000); // eslint-disable-line no-invalid-this

    const paths = getCasePaths('bemjson-template-remove');

    const source = path.join(__dirname, 'levels', 'blocks.common',
      'remove-template', 'remove-template.bh.js');
    const changed = path.join(__dirname, 'levels', 'blocks.common',
      'remove-template', 'remove-template_original.bh.js');

    fse.copySync(changed, source);

    let firstRun = false;
    let firstTimerId = null;
    let secondRun = false;
    let watching;
    const cb = (result) => {
      expect(typeof result).to.be.a('string');

      if (!firstRun) {
        if (firstTimerId) {
          clearTimeout(firstTimerId);
        }

        firstTimerId = setTimeout(() => {
          firstRun = true;
          fse.removeSync(source);
        }, 5000);
      } else if (!secondRun) {
        secondRun = true;
        setTimeout(() => {
          watching && watching.close();
          expect(result).to.eql(require(paths.expected));

          const producedHtml = fs.readFileSync(paths.out_produced).toString();
          const expectedHtml = fs.readFileSync(paths.out_expected).toString();
          expect(producedHtml).to.eql(expectedHtml);

          done();
        }, 5000);
      }
    };

    watching = watchWebpack(paths.source, cb);
  });
});

/**
 * Generate paths to source and expected files
 *
 * @param {String} caseName
 * @return {{source: *, expected: *}}
 */
function getCasePaths(caseName) {
  return {
    'source': path.join(__dirname, 'cases', caseName,
      'source.bemjson.js'),
    'expected': path.join(__dirname, 'cases', caseName,
      'expected.bemjson.json'),
    'out_produced': path.join(__dirname, 'cases', caseName,
      'source.bemjson.html'),
    'out_expected': path.join(__dirname, 'cases', caseName,
      'expected.bemjson.html'),
  };
}
