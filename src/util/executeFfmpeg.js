const { execFile } = require('child_process');
const path = require('path');

module.exports = ({ args, imagesStream, name }) => {
  const child = execFile(
    path.resolve(__dirname, '../lib/ffmpeg'),
    [
      ...args,
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
    }
  );

  imagesStream.pipe(child.stdin);
};
