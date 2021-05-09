# Canvas to stream speed test

Testing different approaches for sending canvas frames to ffmpeg efficiently within Electron JS

## To-Do

- Create a couple of benchmarks

## Instructions

- Add ffmpeg executable of your platform to src/lib/
- Create a new approach to convert a canvas to something ffmpeg can read
- The approach consists of an async conversion function that takes the canvas and returns a single frame and an array of arguments that allow ffmepg to understand the data (see included approaches for reference)
- Save the approach in src/approaches within its own named folder, with an index.js containing an object with ffmpegArgs and canvasToFrame
- Add new approaches to the approaches array, by folder name, in sketch.js
- The render time must be significantly smaller
- The video result must be the same
