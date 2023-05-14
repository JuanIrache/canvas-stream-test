// Create a webm file from the browser and only use ffmpeg to adjust the frame rate
// Inspired by https://stackoverflow.com/questions/58907270/record-at-constant-fps-with-canvascapturemediastream-even-on-slow-computers

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
  constructor(source_canvas, FPS) {
    this.FPS = FPS;
    this.source = source_canvas;
    const canvas = (this.canvas = source_canvas.cloneNode());
    const ctx = (this.drawingContext = canvas.getContext('2d'));

    ctx.drawImage(source_canvas, 0, 0);
    const stream = (this.stream = canvas.captureStream(0));
    const track = (this.track = stream.getVideoTracks()[0]);

    const rec = (this.recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 25000000
    }));
    const chunks = (this.chunks = []);
    rec.ondataavailable = evt => chunks.push(evt.data);
    rec.start();
    waitForEvent(rec, 'start').then(evt => rec.pause());
    this._init = waitForEvent(rec, 'pause');
  }
  async recordFrame() {
    await this._init;
    const rec = this.recorder;
    const canvas = this.canvas;
    const source = this.source;
    const ctx = this.drawingContext;
    if (canvas.width !== source.width || canvas.height !== source.height) {
      canvas.width = source.width;
      canvas.height = source.height;
    }

    const timer = wait(1000 / this.FPS);

    rec.resume();
    await waitForEvent(rec, 'resume');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0);
    this.track.requestFrame();

    await timer;

    rec.pause();
    await waitForEvent(rec, 'pause');
  }
  async export() {
    this.recorder.stop();
    this.stream.getTracks().forEach(track => track.stop());
    await waitForEvent(this.recorder, 'stop');
    return new Blob(this.chunks);
  }
}

let recorder;

module.exports = {
  handleAll: ({ canvas, first, last, name }) =>
    new Promise(async resolve => {
      if (first) {
        recorder = new FrameByFrameCanvasRecorder(canvas, 25);
      }

      await recorder.recordFrame();

      if (last) {
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
            resolve();
          }
        });
      } else resolve();
    })
};
