import * as ort from 'onnxruntime-web';
import { arrayToPolygon } from './utils';
import type {
  ClickType,
  ModelDataFromBoxParams,
  ModelDataFromPointsParams,
  QueryModelReturnTensors,
  SegmentAnythingModelReturnType,
} from './types';

ort.env.debug = false;
// set global logging level
ort.env.logLevel = 'verbose';

// override path of wasm files - for each file
ort.env.wasm.numThreads = 2;
ort.env.wasm.wasmPaths = 'model/';
// ort.env.wasm.proxy = true;

// 1.14.0 需要
// ort.env.wasm.simd = true;
// ort-wasm-simd.wasm
// ort-wasm-threaded.wasm
// ort-wasm.wasm

const UPLOAD_IMAGE_SIZE = 1024;
const EMBEDDINGS_GENERATOR_ENDPOINT = 'https://model-zoo.metademolab.com/predictions/segment_everything_box_model';
const MODEL_DIR = 'model/interactive_module_quantized_592547_2023_03_19_sam6_long_uncertain.onnx';

const modelDataFromPoints = ({ clicks, tensor, modelScale, inferenceType }: ModelDataFromPointsParams) => {
  const _ = tensor;
  let $, _e, tt, nt;
  if (clicks) {
    const j = clicks.length;
    $ = new Float32Array(2 * (j + 1));
    _e = new Float32Array(j + 1);
    const it = clicks.map((st) => ({
      x: Math.floor(st.x * modelScale.redrawScale),
      y: Math.floor(st.y * modelScale.redrawScale),
      clickType: st.clickType,
    }));
    for (let st = 0; st < j; st++) {
      $[2 * st] = it[st].x;
      $[2 * st + 1] = it[st].y;
      _e[st] = it[st].clickType;
    }
    if (inferenceType === 0) {
      $[2 * j] = 0;
      $[2 * j + 1] = 0;
    }
    tt = new ort.Tensor('float32', $, [1, j + 1, 2]);
    nt = new ort.Tensor('float32', _e, [1, j + 1]);
  }
  const rt = new ort.Tensor('float32', [modelScale.height, modelScale.width]);
  if (tt === void 0 || nt === void 0) return;
  const ot = new ort.Tensor('float32', new Float32Array(256 * 256), [1, 1, 256, 256]),
    et = new ort.Tensor('float32', [0]);
  return {
    low_res_embedding: _,
    point_coords: tt,
    point_labels: nt,
    image_size: rt,
    last_pred_mask: ot,
    has_last_pred: et,
  };
};

const modelDataForBox = ({ inferenceRequest, tensor, modelScale }: ModelDataFromBoxParams) => {
  const _e = {
    x: Math.floor(inferenceRequest.topLeft.x * modelScale.redrawScale),
    y: Math.floor(inferenceRequest.topLeft.y * modelScale.redrawScale),
  };
  const tt = {
    x: Math.floor(inferenceRequest.bottomRight.x * modelScale.redrawScale),
    y: Math.floor(inferenceRequest.bottomRight.y * modelScale.redrawScale),
  };
  const $ = new Float32Array(2);
  const _ = new Float32Array(4);
  $[0] = 2;
  $[1] = 3;
  _[0] = _e.x;
  _[1] = tt.y;
  _[2] = tt.x;
  _[3] = _e.y;
  const nt = new ort.Tensor('float32', _, [1, 2, 2]),
    rt = new ort.Tensor('float32', $, [1, 2]),
    ot = new ort.Tensor('float32', [modelScale.height, modelScale.width]),
    et = new ort.Tensor('float32', new Float32Array(256 * 256), [1, 1, 256, 256]),
    j = new ort.Tensor('float32', [0]);
  return {
    low_res_embedding: tensor,
    point_coords: nt,
    point_labels: rt,
    image_size: ot,
    last_pred_mask: et,
    has_last_pred: j,
  };
};
async function queryModelReturnTensors($: HTMLCanvasElement, _e: number, tt: number) {
  const nt = UPLOAD_IMAGE_SIZE / Math.max($.width, $.height),
    rt = Math.round($.width * nt),
    ot = Math.round($.height * nt),
    et = UPLOAD_IMAGE_SIZE / Math.max(_e, tt),
    j = new OffscreenCanvas(rt, ot),
    it = j.getContext('2d');
  if (it === null) throw new Error('Could not get context');
  it.drawImage($, 0, 0, rt, ot);
  const at = await (await j.convertToBlob()).arrayBuffer(),
    ct = await (
      await fetch(EMBEDDINGS_GENERATOR_ENDPOINT, {
        method: 'POST',
        body: at,
      })
    ).json(),
    ut = Uint8Array.from(atob(ct[0]), (pt) => pt.charCodeAt(0)),
    dt = new Float32Array(ut.buffer),
    ft = new ort.Tensor('float32', dt, [1, 256, 64, 64]);
  return {
    scale: {
      height: j.height,
      width: j.width,
      samScale: nt,
      redrawScale: et,
      originalHeight: $.height,
      originalWidth: $.width,
    },
    embeddings: ft,
  };
}
async function queryModelParams($: ort.InferenceSession, _e: QueryModelReturnTensors, tt: ClickType): Promise<[number, number][]> {
  let nt: ModelDataFromPointsParams['clicks'] = [];
  if (tt.type === 0) {
    nt = [{ x: tt.point.x, y: tt.point.y, clickType: 1 }];
  } else if (tt.type === 1) {
    nt = [
      { x: tt.topLeft.x, y: tt.topLeft.y, clickType: 1 },
      { x: tt.bottomRight.x, y: tt.bottomRight.y, clickType: 1 },
    ];
  }
  const rt: ModelDataFromPointsParams = {
    clicks: nt,
    tensor: _e.embeddings,
    modelScale: _e.scale,
    inferenceType: tt.type,
  };
  const ot =
    tt.type === 0
      ? modelDataFromPoints(rt)
      : modelDataForBox({
          tensor: _e.embeddings,
          modelScale: _e.scale,
          inferenceRequest: {
            topLeft: tt.topLeft,
            bottomRight: tt.bottomRight,
            type: tt.type,
          },
        });
  if (ot === void 0) return [];
  const j = (await $.run(ot))[$.outputNames[0]];
  return arrayToPolygon(j.data, _e.scale.width).map((at) => [at[0] / _e.scale.redrawScale, at[1] / _e.scale.redrawScale]);
}
export const segmentAnythingModel = async (): Promise<SegmentAnythingModelReturnType> => {
  const model = await ort.InferenceSession.create(MODEL_DIR);

  return {
    getInferenceMasks: async (canvas: HTMLCanvasElement, width: number, height: number, clicks: ClickType[]) => {
      const res = await queryModelReturnTensors(canvas, width, height);
      return await Promise.all(clicks.map((v) => queryModelParams(model, res, v)));
    },
  };
};
