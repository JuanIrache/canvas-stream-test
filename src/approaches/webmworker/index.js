// Create a browser WEBM and use ffmpeg to adjust the frame rate. Use p5js standard loop to decide frame rate
// Inspired by https://stackoverflow.com/questions/58907270/record-at-constant-fps-with-canvascapturemediastream-even-on-slow-computers (but not frame by frame)

const path = require('path');

const worker = new Worker(path.resolve(__dirname, 'worker.js'));

const wait = ms => new Promise(res => setTimeout(res, ms));

const waitForEvent = (target, type) =>
  new Promise(res =>
    target.addEventListener(type, res, {
      once: true
    })
  );

class WEBMRecorder {
  constructor({ canvas, resolve, pending }) {
    const stream = (this.stream = canvas.captureStream());
    this.writable = true;
    const rec = (this.recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 25000000
    }));
    rec.ondataavailable = async evt => {
      const blob = await new Blob([evt.data]);
      const arrbuf = await blob.arrayBuffer();
      worker.postMessage({ action: 'write', payload: { arrbuf } }, [arrbuf]);
    };
    rec.start(1000);
    waitForEvent(rec, 'start').then(() => resolve({ pending }));
  }
  async export() {
    this.recorder.stop();
    this.stream.getTracks().forEach(track => track.stop());
    await waitForEvent(this.recorder, 'stop');
    worker.postMessage({ action: 'end' });
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
      worker.onmessage = ({ data }) => {
        const { action, payload } = data;
        switch (action) {
          case 'done':
            onceDone();
            break;

          default:
            break;
        }
      };
      worker.postMessage({ action: 'start', payload: { name } });
      recorder = new WEBMRecorder({ canvas, resolve, pending });
    }),
  loopEnd: async () => {
    await wait(500);
    await recorder.export();
  }
};
