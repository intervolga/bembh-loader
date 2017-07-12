/**
 * Walks thru BemJson recursively and invokes callback on each string value
 *
 * @param {Object|Array|String} bemJson
 * @param {Function} cb
 * @return {Object|Array|String}
 */
function walkBemJson(bemJson, cb) {
  let result;

  if (Array.isArray(bemJson)) {
    result = [];
    bemJson.forEach((childBemJson, i) => {
      result[i] = walkBemJson(childBemJson, cb);
    });
  } else if (bemJson instanceof Object) {
    result = {};
    Object.keys(bemJson).forEach((key) => {
      result[key] = walkBemJson(bemJson[key], cb);
    });
  } else if (typeof bemJson === 'string') {
    result = cb(bemJson);
  }

  return result;
}

module.exports = walkBemJson;
