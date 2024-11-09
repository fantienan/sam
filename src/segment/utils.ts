import { Grid } from './grid';
import type { Tensor } from 'onnxruntime-web';

const MAX_CONCAVE_ANGLE_COS = Math.cos(90 / (180 / Math.PI));
const MAX_SEARCH_BBOX_SIZE_PERCENT = 0.6;

/**
 * 计算叉积
 * @param o - 起点
 * @param i - 向量1
 * @param s - 向量2
 * @returns 叉积结果
 */
function ccw(o: number, i: number, s: number, a: number, _: number, $: number): boolean {
  const _e = ($ - i) * (s - o) - (a - i) * (_ - o);
  return _e > 0 ? true : !(_e < 0);
}

/**
 * 检查两条线段是否相交
 * @param o - 线段1
 * @param i - 线段2
 * @returns 是否相交
 */
function intersect_1(o: [number, number][], i: [number, number][]): boolean {
  const s = o[0][0],
    a = o[0][1],
    _ = o[1][0],
    $ = o[1][1],
    _e = i[0][0],
    tt = i[0][1],
    nt = i[1][0],
    rt = i[1][1];
  return ccw(s, a, _e, tt, nt, rt) !== ccw(_, $, _e, tt, nt, rt) && ccw(s, a, _, $, _e, tt) !== ccw(s, a, _, $, nt, rt);
}

/**
 * 创建网格
 * @param o - 点数组
 * @param i - 网格大小
 * @returns 网格对象
 */
function grid$1(o: [number, number][], i: number): Grid {
  return new Grid(o, i);
}

const grid_1 = grid$1;

const format = {
  toXy: function (o: any[], i?: string[]): [number, number][] {
    return i === void 0
      ? o.slice()
      : o.map(function (s) {
          return new Function('pt', `return [pt${i[0]},pt${i[1]}];`)(s);
        });
  },
  fromXy: function (o: [number, number][], i?: string[]): any[] {
    return i === void 0
      ? o.slice()
      : o.map(function (s) {
          return new Function('pt', `const o = {}; o${i[0]}= pt[0]; o${i[1]}= pt[1]; return o;`)(s);
        });
  },
};

/**
 * 计算两个向量的叉积
 * @param o - 起点
 * @param i - 向量1
 * @param s - 向量2
 * @returns 叉积结果
 */
function _cross(o: [number, number], i: [number, number], s: [number, number]): number {
  return (i[0] - o[0]) * (s[1] - o[1]) - (i[1] - o[1]) * (s[0] - o[0]);
}

/**
 * 计算上切线
 * @param o - 点数组
 * @returns 上切线点数组
 */
function _upperTangent(o: [number, number][]): [number, number][] {
  const i: [number, number][] = [];
  for (const point of o) {
    while (i.length >= 2 && _cross(i[i.length - 2], i[i.length - 1], point) <= 0) i.pop();
    i.push(point);
  }
  i.pop();
  return i;
}

/**
 * 计算下切线
 * @param o - 点数组
 * @returns 下切线点数组
 */
function _lowerTangent(o: [number, number][]): [number, number][] {
  const i = o.reverse();
  const s: [number, number][] = [];
  for (const point of i) {
    while (s.length >= 2 && _cross(s[s.length - 2], s[s.length - 1], point) <= 0) s.pop();
    s.push(point);
  }
  s.pop();
  return s;
}

/**
 * 计算凸包
 * @param o - 点数组
 * @returns 凸包点数组
 */
function convex(o: [number, number][]): [number, number][] {
  const i = _upperTangent(o);
  const a = _lowerTangent(o).concat(i);
  a.push(o[0]);
  return a;
}

const convex_1 = convex;

const intersect = intersect_1;
const grid = grid_1;
const formatUtil = format;
const convexHull = convex_1;

/**
 * 过滤重复点
 * @param o - 点数组
 * @returns 过滤后的点数组
 */
function _filterDuplicates(o: [number, number][]): [number, number][] {
  const i: [number, number][] = [o[0]];
  let s = o[0];
  for (const point of o.slice(1)) {
    if (s[0] !== point[0] || s[1] !== point[1]) i.push(point);
    s = point;
  }
  return i;
}

/**
 * 按X坐标排序点数组
 * @param o - 点数组
 * @returns 排序后的点数组
 */
function _sortByX(o: [number, number][]): [number, number][] {
  return o.sort((i, s) => i[0] - s[0] || i[1] - s[1]);
}

/**
 * 计算两点之间的平方距离
 * @param o - 点1
 * @param i - 点2
 * @returns 平方距离
 */
function _sqLength(o: [number, number], i: [number, number]): number {
  return Math.pow(i[0] - o[0], 2) + Math.pow(i[1] - o[1], 2);
}

/**
 * 计算两个向量的余弦值
 * @param o - 起点
 * @param i - 向量1
 * @param s - 向量2
 * @returns 余弦值
 */
function _cos(o: [number, number], i: [number, number], s: [number, number]): number {
  const a = [i[0] - o[0], i[1] - o[1]];
  const _ = [s[0] - o[0], s[1] - o[1]];
  const $ = _sqLength(o, i);
  const _e = _sqLength(o, s);
  return (a[0] * _[0] + a[1] * _[1]) / Math.sqrt($ * _e);
}

/**
 * 检查两条线段是否相交
 * @param o - 线段1
 * @param i - 线段2
 * @returns 是否相交
 */
function _intersect(o: [number, number][], i: [number, number][]): boolean {
  for (let s = 0; s < i.length - 1; s++) {
    const a = [i[s], i[s + 1]];
    if (!((o[0][0] === a[0][0] && o[0][1] === a[0][1]) || (o[0][0] === a[1][0] && o[0][1] === a[1][1])) && intersect(o, a)) return true;
  }
  return false;
}

/**
 * 计算点数组的占用区域
 * @param o - 点数组
 * @returns 占用区域的宽和高
 */
function _occupiedArea(o: [number, number][]): [number, number] {
  let i = Infinity;
  let s = Infinity;
  let a = -Infinity;
  let _ = -Infinity;
  for (const point of o) {
    if (point[0] < i) i = point[0];
    if (point[1] < s) s = point[1];
    if (point[0] > a) a = point[0];
    if (point[1] > _) _ = point[1];
  }
  return [a - i, _ - s];
}

/**
 * 计算两个点的包围盒
 * @param o - 点数组
 * @returns 包围盒
 */
function _bBoxAround(o: [number, number][]): [number, number, number, number] {
  return [Math.min(o[0][0], o[1][0]), Math.min(o[0][1], o[1][1]), Math.max(o[0][0], o[1][0]), Math.max(o[0][1], o[1][1])];
}

/**
 * 计算中点
 * @param o - 线段
 * @param i - 点数组
 * @param s - 线段数组
 * @returns 中点
 */
function _midPoint(o: [number, number][], i: [number, number][], s: [number, number][]): [number, number] | null {
  let a: [number, number] | null = null;
  let _ = MAX_CONCAVE_ANGLE_COS;
  let $ = MAX_CONCAVE_ANGLE_COS;
  let _e: number;
  let tt: number;
  for (const point of i) {
    _e = _cos(o[0], o[1], point);
    tt = _cos(o[1], o[0], point);
    if (_e > _ && tt > $ && !_intersect([o[0], point], s) && !_intersect([o[1], point], s)) {
      _ = _e;
      $ = tt;
      a = point;
    }
  }
  return a;
}

/**
 * 计算凹包
 * @param o - 点数组
 * @param i - 最大边长
 * @param s - 最大搜索包围盒大小
 * @param a - 网格
 * @param _ - 已处理的线段集合
 * @returns 凹包点数组
 */
function _concave(o: [number, number][], i: number, s: number[], a: any, _: Set<string>): [number, number][] {
  let $ = false;
  for (let _e = 0; _e < o.length - 1; _e++) {
    const tt = [o[_e], o[_e + 1]];
    const nt = `${tt[0][0]},${tt[0][1]},${tt[1][0]},${tt[1][1]}`;
    if (_sqLength(tt[0], tt[1]) < i || _.has(nt)) continue;
    let rt = 0;
    let ot = _bBoxAround(tt);
    let et: number;
    let j: number;
    let it: [number, number] | null;
    do {
      ot = a.extendBbox(ot, rt);
      et = ot[2] - ot[0];
      j = ot[3] - ot[1];
      it = _midPoint(tt, a.rangePoints(ot), o);
      rt++;
    } while (it === null && (s[0] > et || s[1] > j));
    if (et >= s[0] && j >= s[1]) _.add(nt);
    if (it !== null) {
      o.splice(_e + 1, 0, it);
      a.removePoint(it);
      $ = !0;
    }
  }
  return $ ? _concave(o, i, s, a, _) : o;
}

/**
 * 计算凸包或凹包
 * @param o - 点数组
 * @param i - 最大边长
 * @param s - 坐标属性
 * @returns 凸包或凹包点数组
 */
function hull(o: [number, number][], i: number, s?: string[]): [number, number][] {
  const a = i || 20;
  const sortedPoints = _filterDuplicates(_sortByX(formatUtil.toXy(o, s)));
  if (sortedPoints.length < 4) {
    const result = sortedPoints.concat([sortedPoints[0]]);
    return s ? formatUtil.fromXy(result, s) : result;
  }
  const occupiedArea = _occupiedArea(sortedPoints);
  const maxSearchBboxSize = [occupiedArea[0] * MAX_SEARCH_BBOX_SIZE_PERCENT, occupiedArea[1] * MAX_SEARCH_BBOX_SIZE_PERCENT];
  const hullPoints = convexHull(sortedPoints);
  const nonHullPoints = sortedPoints.filter((point) => !hullPoints.includes(point));
  const gridSize = Math.ceil(1 / (sortedPoints.length / (occupiedArea[0] * occupiedArea[1])));
  const concaveHull = _concave(hullPoints, Math.pow(a, 2), maxSearchBboxSize, grid(nonHullPoints, gridSize), new Set());
  return s ? formatUtil.fromXy(concaveHull, s) : concaveHull;
}
export function arrayToPolygon(data: Tensor['data'], width: number): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < data.length; i++) {
    if ((data[i] as number) < 0) continue;
    const x = i % width;
    const y = Math.floor(i / width);
    points.push([x, y]);
  }
  return hull(points, 0);
}
