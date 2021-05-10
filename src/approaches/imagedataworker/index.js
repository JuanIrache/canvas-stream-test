// Use imageData approach but handle everything on worker, including ffmpeg

const path = require('path');

const worker = new Worker(path.resolve(__dirname, 'worker.js'));

module.exports = {
  handleAll: ({ canvas, first, last, name }) =>
    new Promise(async resolve => {
      const imageData = canvas
        .getContext('2d')
        .getImageData(0, 0, canvas.width, canvas.height).data.buffer;

      const { width: w, height: h } = canvas;

      worker.onmessage = ({ data }) =>
        resolve(/* actually, handle success or error here */);

      worker.postMessage(
        {
          action: 'saveFrame',
          payload: { first, last, name, imageData, w, h }
        },
        [imageData]
      );
    })
};
