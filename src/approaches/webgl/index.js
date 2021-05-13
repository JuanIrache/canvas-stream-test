// Render in webgl, extract data with readPixels and do ffmpeg in worker. In theory should be fast

const path = require('path');

const worker = new Worker(path.resolve(__dirname, 'worker.js'));

module.exports = {
  webgl: true,
  handleAll: ({ canvas, first, last, name }) =>
    new Promise(async resolve => {
      const pixels = new Uint8Array(canvas.width * canvas.height * 4);
      const gl = canvas.getContext('webgl', {
        preserveDrawingBuffer: true
      });
      gl.readPixels(
        0,
        0,
        canvas.width,
        canvas.height,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels
      );
      const imageData = pixels.buffer;

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
