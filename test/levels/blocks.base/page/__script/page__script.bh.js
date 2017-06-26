module.exports = function(bh) {

  bh.match('page__script', function(ctx, json) {
    var nonce = ctx.tParam('nonceCsp');
    ctx
      .bem(false)
      .tag('script');

    if(json.url) {
      ctx.attr('src', json.url);
    } else if(nonce) {
      ctx.attr('nonce', nonce);
    }
  });

};