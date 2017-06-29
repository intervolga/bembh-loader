const fs = require('fs');
const path = require('path');
const expect = require('expect.js');
const runWebpack = require('./helpers/run-webpack');

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
