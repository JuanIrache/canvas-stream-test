// Import approaches
const approaches = ['worker'];

////////////////////////// Do not edit below this line
const { PassThrough } = require('stream');
const executeFfmpeg = require('./util/executeFfmpeg');

function setup() {
  const p5Canvas = createCanvas(1920, 1080);
  noLoop();

  const paint = i => {
    clear();
    const paintOnce = ii => {
      const a = noise(ii / 100);
      const b = noise(ii / 100 + 10000);
      const c = noise(ii / 100 + 100000000);
      fill(a * 255);
      ellipse(b * width, c * height, 80, 80);
    };
    paintOnce(i);
    paintOnce(i * 2);
    paintOnce(i * 4);
    paintOnce(i * 8);
  };

  const processVideo = async ({ canvasToFrame, ffmpegArgs }, name) => {
    console.log('Start rendering', name);
    const startTime = Date.now();
    const imagesStream = new PassThrough();

    executeFfmpeg({
      args: ffmpegArgs(canvas.width, canvas.height),
      imagesStream,
      name
    });

    const addFrameToStream = frameData =>
      new Promise(resolve => {
        const ok = imagesStream.write(frameData, 'utf8', () => {});
        if (ok) resolve();
        else imagesStream.once('drain', resolve);
      });

    const iterations = 1000;
    for (let i = 0; i <= iterations; i++) {
      if (i % 100 === 0) {
        console.log(Math.round((100 * (i + 1)) / iterations) + '%');
      }
      paint(i);
      const frameData = await canvasToFrame(p5Canvas.elt);
      await addFrameToStream(frameData);
      await new Promise(setImmediate);
    }

    imagesStream.end();
    const duration = Date.now() - startTime;
    return duration;
  };

  const runTest = async () => {
    let benchmark;

    for (const dir of approaches) {
      const approach = require(`./approaches/${dir}/index`);
      const duration = await processVideo(approach, dir);
      if (!benchmark) {
        benchmark = duration;
        console.log(`Benchmark time is ${Math.round(benchmark / 1000)}s`);
      } else if (duration * 2 < benchmark) {
        console.log(
          `${dir} is much faster than the benchmark! (${Math.round(
            duration / 1000
          )}s) Check if videos look the same`
        );
      } else {
        console.log(
          `${dir} is not much faster than the benchmarkh (${Math.round(
            duration / 1000
          )}s)`
        );
      }
    }
  };
  runTest();
}

function draw() {}
