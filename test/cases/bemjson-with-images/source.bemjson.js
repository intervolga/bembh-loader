module.exports = {
  block: 'p',
  content: [
    {
      block: 'img',
      src: 'img/1.jpg'
    },
    {
      block: 'img',
      attrs: {
        src: 'img/1.jpg'
      }
    },
    {
      block: 'img',
      src: './../img/2.jpeg'
    },
    {
      block: 'icons',
      content: [
        './../img/3.png',
        'img/4.png'
      ]
    },
  ],
};
