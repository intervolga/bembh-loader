module.exports = function(bh) {
  bh.match('remove-template', function (ctx) {
    ctx.attr('data-test', '123');
    return {
      block: 'remove-template-wrapper',
      content: ctx.json()
    };
  });
};
