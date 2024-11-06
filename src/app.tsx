import './app.css';
import * as ort from 'onnxruntime-web';
import { useEffect } from 'react';
import image from '/canvas-image.png';

ort.env.debug = false;
// set global logging level
ort.env.logLevel = 'verbose';

// override path of wasm files - for each file
ort.env.wasm.numThreads = 2;
// ort.env.wasm.simd = true;
// ort.env.wasm.proxy = true;

ort.env.wasm.wasmPaths = 'model/';
const UPLOAD_IMAGE_SIZE = 1024;
const EMBEDDINGS_GENERATOR_ENDPOINT = 'https://model-zoo.metademolab.com/predictions/segment_everything_box_model';
// Load the model and create InferenceSession
// Load and preprocess the input image to inputTensor
const session = await ort.InferenceSession.create('model/interactive_module_quantized_592547_2023_03_19_sam6_long_uncertain.onnx');

function App() {
  useEffect(() => {
    const init = async () => {
      // Run inference
      const outputs = await session.run({ input: inputTensor });
      console.log(outputs);
    };
    init();
  }, []);
  return <img src={image} />;
}

export default App;
