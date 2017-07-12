module.exports = function(bh) {
  bh.match('add-template', function (ctx) {
    ctx.attr('data-test', '123');
    return {
      block: 'add-template-wrapper',
      content: ctx.json()
    };
  });
};
