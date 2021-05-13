const { PassThrough } = require('stream');
const { execFile } = require('child_process');
const path = require('path');

let imagesStream;

const addFrameToStream = ({ imageData, imagesStream }) =>
  new Promise(resolve => {
    const ok = imagesStream.write(Buffer.from(imageData), 'utf8', () => {});
    if (ok) resolve();
    else imagesStream.once('drain', resolve);
  });

const executeFfmpeg = ({ imagesStream, name, w, h }) => {
  const child = execFile(
    path.resolve(__dirname, '../../lib/ffmpeg'),
    [
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgba',
      '-s',
      `${w}x${h}`,
      '-i',
      '-',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-y',
      path.resolve(__dirname, `../../../exported/${name}.mp4`)
    ],
    err => {
      if (err) console.error(err);
    }
  );

  imagesStream.pipe(child.stdin);
};

onmessage = async ({ data }) => {
  const { action, payload } = data;
  const { first, last, name, imageData, w, h } = payload;
  if (first) {
    imagesStream = new PassThrough();
    executeFfmpeg({ imagesStream, name, w, h });
  }

  await addFrameToStream({ imagesStream, imageData });

  if (last) imagesStream.end();

  self.postMessage({ action: 'success' });
};
