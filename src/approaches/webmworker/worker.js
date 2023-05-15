const { PassThrough } = require('stream');
const { execFile } = require('child_process');
const path = require('path');

let imagesStream;

const pendingBufs = [];
let writable = true;

const addToStream = ({ imagesStream, arrbuf }) => {
  pendingBufs.push(arrbuf);
  const doWrite = async () => {
    if (pendingBufs.length) {
      const blob = new Blob(pendingBufs);
      const fullArrbuf = await blob.arrayBuffer();
      const buf = Buffer.from(fullArrbuf);
      pendingBufs.length = 0;
      const ok = imagesStream.write(buf, 'utf8', () => {});
      if (!ok) {
        writable = false;
        imagesStream.once('drain', () => {
          writable = true;
          doWrite();
        });
      }
    }
  };
  if (writable) doWrite();
};

const executeFfmpeg = ({ imagesStream, name }) => {
  const child = execFile(
    path.resolve(__dirname, '../../lib/ffmpeg'),
    [
      '-fflags',
      '+genpts',
      '-r',
      '25',
      '-i',
      '-',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-y',
      path.resolve(__dirname, `../../exported/${name}.mp4`)
    ],
    err => {
      if (err) console.error(err);
      else self.postMessage({ action: 'done' });
    }
  );

  imagesStream.pipe(child.stdin);
};

onmessage = async ({ data }) => {
  const { action, payload } = data;
  switch (action) {
    case 'start': {
      const { name } = payload;
      imagesStream = new PassThrough();
      executeFfmpeg({ imagesStream, name });
      break;
    }
    case 'write':
      const { arrbuf } = payload;
      addToStream({ imagesStream, arrbuf });
      break;

    case 'end':
      while (pendingBufs.length) await new Promise(setImmediate);
      imagesStream.end();
      break;

    default:
      break;
  }
};
