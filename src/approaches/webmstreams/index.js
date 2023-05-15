// Create a browser WEBM and use ffmpeg to adjust the frame rate. Use p5js standard loop to decide frame rate
// Inspired by https://stackoverflow.com/questions/58907270/record-at-constant-fps-with-canvascapturemediastream-even-on-slow-computers (but not frame by frame)

const path = require('path');
const executeFfmpeg = require('../../util/executeFfmpeg');

const wait = ms => new Promise(res => setTimeout(res, ms));

const waitForEvent = (target, type) =>
  new Promise(res =>
    target.addEventListener(type, res, {
      once: true
    })
  );

const chunksToBuf = async chunks => {
  const blob = await new Blob(chunks);
  const arrbuf = await blob.arrayBuffer();
  const buf = Buffer.from(arrbuf);
  chunks.length = 0;
  return buf;
};

class WEBMRecorder {
  constructor({ canvas, resolve, pending }) {
    const imagesStream = (this.imagesStream = new PassThrough());
    const stream = (this.stream = canvas.captureStream());
    this.writable = true;
    const rec = (this.recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 25000000
    }));
    const chunks = (this.chunks = []);
    rec.ondataavailable = async evt => {
      chunks.push(evt.data);
      const doWrite = async () => {
        if (chunks.length) {
          const buf = await chunksToBuf(chunks);
          const ok = imagesStream.write(buf, 'utf8', () => {});
          if (!ok) {
            this.writable = false;
            imagesStream.once('drain', () => {
              this.writable = true;
              doWrite();
            });
          }
        }
      };
      if (this.writable) doWrite();
    };
    rec.start(5000);
    waitForEvent(rec, 'start').then(() => resolve({ pending }));
  }
  async export() {
    this.recorder.stop();
    this.stream.getTracks().forEach(track => track.stop());
    await waitForEvent(this.recorder, 'stop');
    while (this.chunks.length) await new Promise(setImmediate);
    this.imagesStream.end();
  }
}

let recorder;

module.exports = {
  loopStart: ({ canvas, name }) =>
    new Promise(resolve => {
      let onceDone;
      const pending = new Promise(function (resolve) {
        onceDone = resolve;
      });
      recorder = new WEBMRecorder({ canvas, resolve, pending });
      executeFfmpeg({
        args: ['-fflags', '+genpts', '-r', '25'],
        name,
        done: onceDone,
        imagesStream: recorder.imagesStream
      });
    }),
  loopEnd: async () => {
    await wait(500);
    await recorder.export();
  }
};
