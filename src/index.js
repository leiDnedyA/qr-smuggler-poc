import jabcode from './jabcode/jabcode.js'
import video from './video.js';

const MAX_BARCODE_TEXT_LENGTH = 300;
const DELAY_MS = 200;

const startButton = document.getElementById('start-button');
const recvImage = document.getElementById('recv-image');
const dataUrlElement = document.getElementById('data-url-text');

const readBuffer = {
  buffer: null,
  i: 0,
  len: -1
}

function loadData(data) {
  if (!readBuffer.buffer) {
    readBuffer.buffer = new Array(data.len)
    buffer.len = data.len;
    buffer.i = data.i;
  }
  readBuffer.buffer[data.i] = data.chunk;
  console.log('loading full data')
  let dataUrl = "";
  for (let chunk of readBuffer.buffer) {
    dataUrl += chunk;
  }
  recvImage.src = dataUrl;
  if (readBuffer.buffer.every(element => !!element) || data.i === data.len - 1) {
  }
}

video.init();
video.captureOnInterval(async (imageBlob) => {
  const content = await jabcode.readImage(imageBlob);
  if (!content) return;
  if (content.startsWith('noop')) {
    console.log('noop');
    return;
  }
  try {
    const data = JSON.parse(content);
    console.log(data);
    loadData(data);
  } catch (e) {
    console.error(e);
  }
}, DELAY_MS);

async function compressImage(file, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions (optional: resize the image)
        canvas.width = 200;
        canvas.height = 200;

        ctx.drawImage(img, 0, 0, 200, 200);

        // Get compressed image data as a data URL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function setJabcode(dataString) {
  const pngBlob = await jabcode.createEncoding(dataString);
  const blobUrl = URL.createObjectURL(pngBlob);
  recvImage.src = blobUrl;
}

async function sendTextViaJabcode(text) {
  let i = 0;
  let count = 0;
  let total = Math.floor(text.length / MAX_BARCODE_TEXT_LENGTH);
  while (true) {
    const start = i;
    const end = i + MAX_BARCODE_TEXT_LENGTH;

    const chunk = text.length < end
      ? text.slice(start)
      : text.slice(start, end);

    const content = {
      'i': count,
      'len': total,
      chunk
    }

    // console.log(content);

    setJabcode(JSON.stringify(content));

    i += MAX_BARCODE_TEXT_LENGTH;
    count++;

    await new Promise(res => setTimeout(() => res(), DELAY_MS));
    if (i >= text.length) {
      i = 0;
      count = 0;
    }
  }
}

const fileInput = document.getElementById("file-input");
fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file && file.type.startsWith("image/")) {
    try {
      // const dataURL = await fileToBase64(compressedFile);
      const dataURL = await compressImage(file, .1);
      recvImage.src = dataURL;
      dataUrlElement.value = dataURL;
      console.log(dataURL);
      // setJabcode("noop" + ("0" * 100));
      startButton.onclick = () => { sendTextViaJabcode(dataURL); };
    } catch (error) {
      console.error("Error converting file to Base64:", error);
    }
  }
});
