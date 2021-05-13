// Import approaches
const benchmarkApproach = 'worker';
const approaches = ['basic', 'imagedata', 'imagedataworker', 'webgl'];

// Try with more frames or complex images for a solid solution

const frames = 1000;
const complexity = 10;
const clearBackground = false;

////////////////////////// Do not edit below this line
const { PassThrough } = require('stream');
const executeFfmpeg = require('./util/executeFfmpeg');

let font;

function preload() {
  font = loadFont('util/font.ttf');
}

function setup() {
  let p5Canvas = createCanvas(1920, 1080);
  noLoop();

  const paint = ({ i, percent }) => {
    if (clearBackground) clear();

    const paintOnce = ii => {
      const a = noise(ii / 100);
      const b = noise(ii / 100 + 10);
      const c = noise(ii / 100 + 10000);
      const d = noise(ii / 100 + 1000000);
      const e = noise(ii / 100 + 100000000);
      const f = noise(ii / 100 + 1000000000);
      const g = noise(ii / 100 + 1000000000);
      fill(a * 255, b * 255, c * 255);
      stroke(0, f * 100);
      ellipse(d * width, e * height, 80 * g, 80 * g);
    };

    for (let j = 0; j < complexity; j++) {
      noiseSeed(j);
      paintOnce(i);
    }

    noStroke();
    fill(255);
    rect(0, 0, 30, 12);
    fill(0);
    text(`${percent}%`, 0, 10);
  };

  const processVideo = async (
    { canvasToFrame, ffmpegArgs, handleAll, webgl },
    name
  ) => {
    p5Canvas.remove();
    p5Canvas = createCanvas(1920, 1080, webgl ? WEBGL : P2D);
    push();
    if (webgl) {
      textFont(font);
      translate(-width / 2, -height / 2);
    }
    clear();
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
    pop();
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
