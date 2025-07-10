import jabcode from './jabcode/jabcode.js'

const fileInput = document.querySelector('#jabcode-input');


// window.addEventListener('load', async () => {
//   const pngBlob = await jabcode.createEncoding('test');
//   console.log(pngBlob)
//   const blobUrl = URL.createObjectURL(pngBlob);
//   const imgElement = document.getElementById('recv-image'); // Or document.createElement('img');
//   imgElement.src = blobUrl;
// });
//
// if (fileInput)
//   fileInput.onchange = async (e) => {
//     e.preventDefault();
//
//     const file = e.target.files[0];
//     if (!file) return;
//
//     console.log(await jabcode.readImage(file));
//
//   }
