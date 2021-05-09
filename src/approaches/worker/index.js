// Do the conversion from canvas to PNG in parallel in a Worker and send that to ffmpeg

const path = require('path');

const worker = new Worker(path.resolve(__dirname, 'worker.js'));

let initialised;

module.exports = {
  ffmpegArgs: () => ['-f', 'image2pipe'],
  canvasToFrame: canvas =>
    new Promise(async resolve => {
      if (!initialised) {
        initialised = true;
        worker.postMessage({
          action: 'setSize',
          payload: { size: [canvas.width, canvas.height] }
        });
      }

      const bitmap = await createImageBitmap(canvas);

      worker.onmessage = ({ data }) => {
        resolve(Buffer.from(data.payload, 'base64'));
      };

      worker.postMessage(
        {
          action: 'saveFrame',
          payload: { bitmap, stream: true }
        },
        [bitmap]
      );
    })
};
