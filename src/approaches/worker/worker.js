const canvas = new OffscreenCanvas(300, 300);
const ctx = canvas.getContext('bitmaprenderer');

const saveFrame = async ({ bitmap }) => {
  ctx.transferFromImageBitmap(bitmap);
  const blob = await canvas.convertToBlob();
  const arrBuf = await blob.arrayBuffer();
  self.postMessage({ action: 'success', payload: arrBuf }, [arrBuf]);
};

onmessage = ({ data }) => {
  const { action, payload } = data;
  if (action === 'setSize') {
    const { size } = payload;
    canvas.width = size[0];
    canvas.height = size[1];
  } else if (action === 'saveFrame') saveFrame(payload);
};
