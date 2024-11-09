import { Tensor, TypedTensor } from 'onnxruntime-web';

export type ClickType = SinglePointClickType | BoxClickType;

export type SinglePointClickType = {
  type: 0;
  point: { x: number; y: number };
};

export type BoxClickType = {
  type: 1;
  topLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
};

export type SegmentAnythingModelReturnType = {
  getInferenceMasks: ($: HTMLCanvasElement, _e: number, tt: number, nt: ClickType[]) => Promise<[number, number][][]>;
};

export type ModelDataFromPointsParams = {
  clicks: {
    x: number;
    y: number;
    clickType: 1;
  }[];
  tensor: TypedTensor<Tensor.Type>;
  modelScale: ModelScale;
  inferenceType: keyof InferenceType;
};

export type ModelDataFromBoxParams = {
  tensor: TypedTensor<Tensor.Type>;
  modelScale: ModelScale;
  inferenceRequest: BoxClickType;
};

export type InferenceType = {
  0: 'SinglePoint';
  1: 'BoundingBox';
  SinglePoint: 0;
  BoundingBox: 1;
};

export type ModelScale = {
  height: number;
  width: number;
  samScale: number;
  redrawScale: number;
  originalHeight: number;
  originalWidth: number;
};

export type QueryModelReturnTensors = {
  scale: ModelScale;
  embeddings: TypedTensor<Tensor.Type>;
};
