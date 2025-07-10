import jabcode from './jabcode/jabcode.js'
import video from './video.js';

const MAX_BARCODE_TEXT_LENGTH = 80;
const WEB_WORKER_COUNT = 12;

const sendButton = document.getElementById('send-button');
const readButton = document.getElementById('read-button')
const recvImage = document.getElementById('recv-image');
const dataUrlElement = document.getElementById('data-url-text');
const progressElement = document.getElementById('percent');
const readContainer = document.getElementById('read-container');
const sendContainer = document.getElementById('send-container');
const buttonContainer = document.getElementById('button-container');

const readBuffer = {
  buffer: null,
  indicatorBuffer: null,
  len: -1
}

window.readBuffer = readBuffer;

if (!window.Worker) {
  alert("Browser too old, no workers!!!");
  throw new Error("Browser outdated.");
}

let currWorkerIndex = 0;
const workerCallback = ({ data: content }) => {
  if (!content) return;
  if (content.startsWith('noop')) {
    console.log('noop');
    return;
  }
  try {
    const data = JSON.parse(content);
    loadData(data);
  } catch (e) {
    console.error(e);
  }
}

const workers = [];
for (let i = 0; i < WEB_WORKER_COUNT; i++) {
  const worker = new Worker("src/worker.js", { type: 'module' });
  worker.onmessage = workerCallback;
  workers.push(worker);
}


function loadData(data) {
  console.log(data);
  console.log(readBuffer)
  if (!readBuffer.buffer) {
    readBuffer.buffer = new Array(data.len)
    readBuffer.indicatorBuffer = new Array(data.len);
    for (let i = 0; i < data.len; i++) {
      readBuffer.indicatorBuffer[i] = 0;
    }
    readBuffer.len = data.len;
  }
  // if (readBuffer.indicatorBuffer[data.i]) return;
  readBuffer.buffer[data.i] = data.chunk;
  readBuffer.indicatorBuffer[data.i] = 1;
  const percent = readBuffer.indicatorBuffer.reduce((accum, curr) => {
    return accum + curr;
  }, 0) / readBuffer.len;
  const percentText = `${Math.floor(percent * 100)}%`
  progressElement.innerText = percentText;
  console.log(percent);
  if (percent === 1) {
    console.log('loading full data')
    let dataUrl = "";
    for (let chunk of readBuffer.buffer) {
      dataUrl += chunk;
    }
    recvImage.src = dataUrl;
    video.clearInterval();
    readContainer.style.display = 'none';
    buttonContainer.style.display = 'none';
    adjustImageHeight();
  }
}

readButton.onclick = () => {
  readContainer.style.display = 'block';
  sendContainer.style.display = 'none';
  buttonContainer.style.display = 'none';
  video.init();
  video.captureOnInterval((imageBlob) => {
    const worker = workers[currWorkerIndex];
    worker.postMessage(imageBlob);
    currWorkerIndex = (currWorkerIndex + 1) % WEB_WORKER_COUNT;
  }, 1);
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

const jabcodeCache = {}
async function setJabcode(dataString) {
  if (jabcodeCache.hasOwnProperty(dataString)) {
    const blobUrl = jabcodeCache[dataString];
    recvImage.src = blobUrl;
    return;
  }
  const pngBlob = await jabcode.createEncoding(dataString);
  const blobUrl = URL.createObjectURL(pngBlob);
  jabcodeCache[dataString] = blobUrl;
  recvImage.src = blobUrl;
}

function sendTextViaJabcode(text) {
  let i = 0;
  let count = 0;
  let total = Math.ceil(text.length / MAX_BARCODE_TEXT_LENGTH);
  const animation = async () => {
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

    if (i >= text.length) {
      i = 0;
      count = 0;
    }
    await new Promise(res => {
      setTimeout(() => { res() }, 150);
    })
    animation();
  }
  animation();
}

const adjustImageHeight = () => {
  let width = Math.min(recvImage.clientWidth, 500);
  recvImage.style.width = `${width}px`
  recvImage.style.height = `${width}px`;
}

const fileInput = document.getElementById("file-input");
fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file && file.type.startsWith("image/")) {
    try {
      // const dataURL = await fileToBase64(compressedFile);
      const dataURL = await compressImage(file, .3);
      adjustImageHeight();
      recvImage.src = dataURL;
      dataUrlElement.value = dataURL;
      console.log(dataURL);
      // setJabcode("noop" + ("0" * 100));
      console.log(sendButton)
      sendButton.onclick = () => { sendTextViaJabcode(dataURL); };
    } catch (error) {
      console.error("Error converting file to Base64:", error);
    }
  }
});
