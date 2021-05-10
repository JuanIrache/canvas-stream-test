// Import approaches
const benchmarkApproach = 'worker';
const approaches = ['basic', 'imagedata', 'imagedataworker'];

// Try with more frames or complex images for a solid solution

const frames = 1000;
const complexity = 10;

////////////////////////// Do not edit below this line
const { PassThrough } = require('stream');
const executeFfmpeg = require('./util/executeFfmpeg');

function setup() {
  const p5Canvas = createCanvas(1920, 1080);
  noLoop();

  const paint = ({ i, percent }) => {
    clear();
    const paintOnce = ii => {
      const a = noise(ii / 100);
      const b = noise(ii / 100 + 10);
      const c = noise(ii / 100 + 10000);
      const d = noise(ii / 100 + 1000000);
      const e = noise(ii / 100 + 100000000);
      fill(a * 255, b * 255, c * 255);
      ellipse(d * width, e * height, 80, 80);
    };
    for (let j = 1; j <= complexity; j++) {
      paintOnce(i + j * 5);
    }

    fill(0);
    text(`${percent}%`, 10, 10);
  };

  const processVideo = async (
    { canvasToFrame, ffmpegArgs, handleAll },
    name
  ) => {
    console.log('Start rendering', name, 'approach');
    const startTime = Date.now();

    if (handleAll) {
      for (let i = 0; i <= frames; i++) {
        paint({ i, percent: Math.round((100 * i) / frames) });
        await handleAll({ canvas, first: i === 0, last: i === frames, name });
        // Not really doing much in this case
        //   await new Promise(setImmediate);
      }
    } else {
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

      for (let i = 0; i <= frames; i++) {
        paint({ i, percent: Math.round((100 * i) / frames) });
        const frameData = await canvasToFrame(p5Canvas.elt);
        await addFrameToStream(frameData);
        // Not really doing much in this case
        //   await new Promise(setImmediate);
      }

      imagesStream.end();
    }
    const duration = Date.now() - startTime;
    return duration;
  };

  const runTest = async () => {
    const benchmark = await processVideo(
      require(`./approaches/${benchmarkApproach}/index`),
      benchmarkApproach
    );

    const toSec = ms => Math.round(ms / 1000);

    const results = [[benchmarkApproach, toSec(benchmark) + ' s', '100%']];

    console.log(
      `Benchmark (${benchmarkApproach}) duration is ${toSec(benchmark)}s`
    );

    for (const dir of approaches) {
      const approach = require(`./approaches/${dir}/index`);
      const duration = await processVideo(approach, dir);
      if (duration < benchmark) {
        console.log(
          `${dir} approach is faster than the benchmark! (${toSec(
            duration
          )}s) Check if videos look the same`
        );
      } else {
        console.log(`${dir} approach is not fast enough (${toSec(duration)}s)`);
      }
      results.push([
        dir,
        toSec(duration) + ' s',
        Math.round((100 * duration) / benchmark) + '%'
      ]);
    }
    console.table(results);
  };
  setImmediate(runTest);
}

function draw() {}
