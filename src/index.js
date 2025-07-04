import QRScanner from './qr-scanner.min.js';
import JabcodeJSInterface from './jabcodeJSLib.min.js'

const MAX_QR_TEXT_LENGTH = 82;
const DELAY_MS = 200;
const qrCode = new QRCode(document.getElementById("qrcode"));

const startButton = document.getElementById('start-button');
const recvImage = document.getElementById('recv-image');
const dataUrlElement = document.getElementById('data-url-text');

const readData = {
  buffer: null,
  i: 0,
  len: -1
}

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

async function sendTextViaQR(text) {
  let i = 0;
  let count = 0;
  let total = Math.floor(text.length / MAX_QR_TEXT_LENGTH);
  while (true) {
    const start = i;
    const end = i + MAX_QR_TEXT_LENGTH;

    const chunk = text.length < end
      ? text.slice(start)
      : text.slice(start, end);

    qrCode.clear();
    qrCode.makeCode(JSON.stringify({
      'i': count,
      'len': total,
      chunk
    }));

    i += MAX_QR_TEXT_LENGTH;
    count++;

    await new Promise(res => setTimeout(() => res(), DELAY_MS));
    if (i >= text.length) {
      i = 0;
      count = 0;
    }
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
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
      qrCode.makeCode("noop" + ("0" * 100));
      startButton.onclick = () => { sendTextViaQR(dataURL); };
    } catch (error) {
      console.error("Error converting file to Base64:", error);
    }
  }
});

const videoElem = document.getElementById("camera-video");
const qrScanner = new QRScanner(
  videoElem,
  result => {
    try {
      if (result.data.includes("noop")) {
        console.log('good');
        return;
      } // test code

      const data = JSON.parse(result.data);
      console.log('decoded qr code:', data)
      if (data.i === 0 && !readData.buffer) {
        readData.buffer = new Array(data.len)
        buffer.len = data.len;
        buffer.i = data.i;
      }
      readData.buffer[data.i] = data.chunk;
      console.log('loading full data')
      let dataUrl = "";
      for (let chunk of readData.buffer) {
        dataUrl += chunk;
      }
      recvImage.src = dataUrl;
      if (readData.buffer.every(element => !!element) || data.i === data.len - 1) {
      }
    } catch (e) {
      console.error(e);
      console.log(result)
    }
  },
  { /* your options or returnDetailedScanResult: true if you're not specifying any other options */ },
);

qrScanner.start();
