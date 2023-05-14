const { execFile } = require('child_process');
const path = require('path');

module.exports = ({ args, imagesStream, name, done }) => {
  const child = execFile(
    path.resolve(__dirname, '../lib/ffmpeg'),
    [
      ...args,
      ...(imagesStream ? ['-i', '-'] : []),
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-y',
      path.resolve(__dirname, `../../exported/${name}.mp4`)
    ],
    err => {
      if (err) console.error(err);
      else if (done) done();
    }
  );

  // child.stderr.on('data', console.log);

  // child.stdout.on('data', console.log);

  if (imagesStream) imagesStream.pipe(child.stdin);
};
