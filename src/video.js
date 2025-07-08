// https://stackoverflow.com/questions/12168909/blob-from-dataurl
function dataURItoBlob(dataURI) {
  var byteString = atob(dataURI.split(',')[1]);
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  var blob = new Blob([ab], { type: mimeString });
  return blob;
}

// https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos
const video = document.getElementById("camera-video");
const captureButton = document.getElementById('capture-button');

const width = 500;
let height = 0;
let streaming = false;

function takePicture() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext("2d");
  let dataUri = null;
  if (width && height) {
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);
    dataUri = canvas.toDataURL("image/png");
  } else {
  }
  canvas.remove();
  return dataURItoBlob(dataUri);
}

const Video = {
  init: (handleCaptureImage) => {

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        video.srcObject = stream;
        video.play();
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
      });

    video.addEventListener(
      "canplay",
      (ev) => {
        if (!streaming) {
          height = video.videoHeight / (video.videoWidth / width);

          video.setAttribute("width", width);
          video.setAttribute("height", height);
          streaming = true;
        }
      },
      false,
    );

    captureButton.addEventListener(
      "click",
      (ev) => {
        handleCaptureImage(takePicture());
        ev.preventDefault();
      },
      false,
    );
  }
};

export default Video;
