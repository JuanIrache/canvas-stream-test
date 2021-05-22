# Canvas to stream speed test

Testing different approaches for sending canvas frames to ffmpeg efficiently within Electron JS

## Instructions

- Add ffmpeg executable of your platform to src/lib/
- run npm install and npm start (see progress percent for each approach on top left corner)
- Watch results in console
- Compare the video results in the exports folder
- Try with different amounts of frames, complexity, clearing the background, resolutions...

## For adding approaches:

- The approach consists of either:
  a) An async conversion function (canvasToFrame) that takes the canvas and returns a single frame and a function (canvasToFrame) that gets withd and height and returns an array of arguments that allow ffmepg to understand the data (see included approaches for reference)
  b) A handleAll function that takes the canvas and some metadata (first or last frame, name) and handles the entire video recording process
- Save the approach in src/approaches within its own named folder, with an index.js containing an object with the chosen functions
- Add new approaches to the approaches array, by folder name, in sketch.js

## Conclusions

- Using imageData as opposed to converting the canvas to PNG and using ffmpeg in a worker provide the best results. PNG approaches perform a bit better if the background is reset in every frame (fewer painted pixels are converted to PNG), but still don't match imageData approaches
- Using webgl and reading the data with readpixels also seems to be efficient, but this might not be viable in some use cases
- Drawing to a hidden canvas (p5.Renderer object) seems to provide a clear advantage in some approaches, not in webgl
- Real world applications where multiple inputs are overlayed and the program is doing intensive work in addition to the encoding do not seem consistent with these results. There, the "worker" approach seems to be faster in most cases
