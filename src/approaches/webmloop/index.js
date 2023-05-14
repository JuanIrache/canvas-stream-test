// Create a browser WEBM and use ffmpeg to adjust the frame rate. Use p5js standard loop to decide frame rate
// Inspired by https://stackoverflow.com/questions/58907270/record-at-constant-fps-with-canvascapturemediastream-even-on-slow-computers (but not frame by frame)

const path = require('path');
const { writeFile } = require('fs/promises');
const { unlink } = require('fs');
const executeFfmpeg = require('../../util/executeFfmpeg');

const wait = ms => new Promise(res => setTimeout(res, ms));

const waitForEvent = (target, type) =>
  new Promise(res =>
    target.addEventListener(type, res, {
      once: true
    })
  );

class FrameByFrameCanvasRecorder {
  constructor(source_canvas, resolve, pending) {
    this.source = source_canvas;
    const stream = (this.stream = source_canvas.captureStream());
    this.track = stream.getVideoTracks()[0];

    const rec = (this.recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 25000000
    }));
    const chunks = (this.chunks = []);
    rec.ondataavailable = evt => chunks.push(evt.data);
    rec.start();
    waitForEvent(rec, 'start').then(() => resolve({ pending }));
  }
  async export() {
    this.recorder.stop();
    this.stream.getTracks().forEach(track => track.stop());
    await waitForEvent(this.recorder, 'stop');
    return new Blob(this.chunks);
  }
}

let recorder, onceDone;

module.exports = {
  loopStart: ({ canvas }) =>
    new Promise(resolve => {
      const pending = new Promise(function (resolve) {
        onceDone = resolve;
      });
      recorder = new FrameByFrameCanvasRecorder(canvas, resolve, pending);
    }),
  loopEnd: async ({ name }) => {
    await wait(500);
    const blob = await recorder.export();

    const buffer = Buffer.from(await blob.arrayBuffer());

    const tempPath = path.resolve(__dirname, `../../../exported/temp.webm`);
    await writeFile(tempPath, buffer);
    executeFfmpeg({
      args: ['-fflags', '+genpts', '-r', '25', '-i', tempPath],
      name,
      done: () => {
        unlink(tempPath, () => {});
        onceDone();
      }
    });
  }
};
