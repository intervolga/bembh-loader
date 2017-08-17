module.exports = {
  block: 'p',
  content: [
    {
      block: 'img',
      src: 'img/img-1.png',
    },
    {
      block: 'img',
      attrs: {
        src: './img/img-1.png',
      },
    },
    {
      block: 'img',
      src: './../img/img-2.png',
    },
    {
      block: 'icons',
      content: [
        './../img/img-3.jpg',
        'img/img-4.png',
      ],
    },
  ],
};
