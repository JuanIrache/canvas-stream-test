// Standard browser approach to convert canvas frames to png

module.exports = {
  ffmpegArgs: () => ['-f', 'image2pipe'],
  canvasToFrame: canvas =>
    new Promise(resolve =>
      canvas.toBlob(
        async blob => resolve(Buffer.from(await blob.arrayBuffer(), 'base64')),
        'image/png'
      )
    )
};
