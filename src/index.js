import Video from './video.js';

Video.init(console.log);

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
