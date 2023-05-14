// Import approaches
const benchmarkApproach = 'worker';
const approaches = ['basic', 'imagedata', 'imagedataworker', 'webgl'];

// Try with more frames or complex images for a solid solution

const frames = 1000;
const complexity = 10;
const clearBackground = false;
const frameWidth = 1920;
const frameHeight = 1080;
const visualize = true; // View the frames as they render

////////////////////////// Do not edit below this line
const { PassThrough } = require('stream');
const executeFfmpeg = require('./util/executeFfmpeg');

function setup() {
  if (visualize) createCanvas(frameWidth, frameHeight);
  else createCanvas(30, 12);
  noLoop();

  const paint = ({ i, percent, graph }) => {
    if (clearBackground) g.clear();

    const paintOnce = ii => {
      const a = noise(ii / 100);
      const b = noise(ii / 100 + 10);
      const c = noise(ii / 100 + 10000);
      const d = noise(ii / 100 + 1000000);
      const e = noise(ii / 100 + 100000000);
      const f = noise(ii / 100 + 1000000000);
      const g = noise(ii / 100 + 1000000000);
      graph.fill(a * 255, b * 255, c * 255);
      graph.stroke(0, f * 100);
      graph.ellipse(d * frameWidth, e * frameHeight, 80 * g, 80 * g);
    };

    for (let j = 0; j < complexity; j++) {
      noiseSeed(j);
      paintOnce(i);
    }

    if (visualize) {
      image(graph, 0, 0);
      noStroke();
      fill(255);
      rect(0, 0, 30, 12);
    } else background(255);
    fill(0);
    text(`${percent}%`, 0, 10);
  };

  const processVideo = async (
    { canvasToFrame, ffmpegArgs, handleAll, webgl },
    name
  ) => {
    const graph = createGraphics(frameWidth, frameHeight, webgl ? WEBGL : P2D);
    if (webgl) graph.translate(-frameWidth / 2, -frameHeight / 2);

    clear();
    console.log('Start rendering', name, 'approach');
    const startTime = Date.now();

    if (handleAll) {
      for (let i = 0; i <= frames; i++) {
        paint({ i, percent: Math.round((100 * i) / frames), graph });
        await handleAll({
          canvas: graph.elt,
          first: i === 0,
          last: i === frames,
          name
        });
      }
    } else {
      const imagesStream = new PassThrough();
      let done = false;
      executeFfmpeg({
        args: ffmpegArgs(frameWidth, frameHeight),
        imagesStream,
        name,
        done: () => (done = true)
      });

      const addFrameToStream = frameData =>
        new Promise(resolve => {
          const ok = imagesStream.write(frameData, 'utf8', () => {});
          if (ok) resolve();
          else imagesStream.once('drain', resolve);
        });

      for (let i = 0; i <= frames; i++) {
        paint({ i, percent: Math.round((100 * i) / frames), graph });
        const frameData = await canvasToFrame(graph.elt);
        await addFrameToStream(frameData);
      }

      imagesStream.end();

      while (!done) await new Promise(setImmediate);
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
