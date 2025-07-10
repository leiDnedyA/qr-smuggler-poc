import jabcode from './jabcode/jabcode.js'

onmessage = async ({ data: imageBlob }) => {
  try {
    const content = await jabcode.readImage(imageBlob);
    postMessage(content);
  } catch (e) {
    console.error('worker probably OOMed.')
  } finally {
    URL.revokeObjectURL(imageBlob);
  }
}
