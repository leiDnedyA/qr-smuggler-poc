import jabcode from './jabcode/jabcode.js'

const fileInput = document.querySelector('#jabcode-input');


if (fileInput)
  fileInput.onchange = async (e) => {
    e.preventDefault();

    const file = e.target.files[0];
    if (!file) return;

    console.log(await jabcode.readImage(file));

  }
