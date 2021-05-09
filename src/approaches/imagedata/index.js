// Use ctx.getImageData to send the raw image data quickly to ffmpeg

module.exports = {
  ffmpegArgs: (w, h) => [
    '-f',
    'rawvideo',
    '-pix_fmt',
    'rgba',
    '-s',
    `${w}x${h}`
  ],
  canvasToFrame: canvas =>
    Buffer.from(
      canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
        .data
    )
};
