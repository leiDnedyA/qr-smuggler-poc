import jabcode from './jabcode/jabcode.js'

const fileInput = document.querySelector('#jabcode-input');

async function jpegFileToPngBlob(file) {
  return new Promise((res) => {
    const img = new Image();
    const reader = new FileReader();

    let pngBlob = null;
    reader.onload = function(e) {
      img.src = e.target.result;
    };

    img.onload = async function() {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      pngBlob = await new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/png');
      });
      res(pngBlob);
    };

    reader.readAsDataURL(file);
  })
}

fileInput.onchange = async (e) => {
  e.preventDefault();

  const file = e.target.files[0];
  if (!file) return;

  let pngBlob = await jpegFileToPngBlob(file);

  console.log(pngBlob);

}
