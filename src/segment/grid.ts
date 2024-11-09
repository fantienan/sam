export class Grid {
  private _cells: number[][][][];
  private _cellSize: number;
  private _reverseCellSize: number;

  constructor(points: number[][], cellSize: number) {
    this._cells = [];
    this._cellSize = cellSize;
    this._reverseCellSize = 1 / cellSize;
    for (const point of points) {
      const x = this.coordToCellNum(point[0]);
      const y = this.coordToCellNum(point[1]);
      if (this._cells[x]) {
        if (this._cells[x][y]) {
          this._cells[x][y].push(point);
        } else {
          this._cells[x][y] = [point];
        }
      } else {
        const cellRow: number[][][] = [];
        cellRow[y] = [point];
        this._cells[x] = cellRow;
      }
    }
  }

  cellPoints(x: number, y: number): number[][] {
    return this._cells[x] !== undefined && this._cells[x][y] !== undefined ? this._cells[x][y] : [];
  }

  rangePoints(bbox: number[]): number[][] {
    const xMin = this.coordToCellNum(bbox[0]);
    const yMin = this.coordToCellNum(bbox[1]);
    const xMax = this.coordToCellNum(bbox[2]);
    const yMax = this.coordToCellNum(bbox[3]);
    const points: number[][] = [];
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        for (const point of this.cellPoints(x, y)) {
          points.push(point);
        }
      }
    }
    return points;
  }

  removePoint(point: number[]): number[][] {
    const x = this.coordToCellNum(point[0]);
    const y = this.coordToCellNum(point[1]);
    const cell = this._cells[x][y];
    let index: number | undefined;
    for (let i = 0; i < cell.length; i++) {
      if (cell[i][0] === point[0] && cell[i][1] === point[1]) {
        index = i;
        break;
      }
    }
    if (index !== undefined) {
      cell.splice(index, 1);
    }
    return cell;
  }

  trunc(value: number): number {
    return Math.trunc ? Math.trunc(value) : value - (value % 1);
  }

  coordToCellNum(coord: number): number {
    return this.trunc(coord * this._reverseCellSize);
  }

  extendBbox(bbox: number[], margin: number): number[] {
    return [
      bbox[0] - margin * this._cellSize,
      bbox[1] - margin * this._cellSize,
      bbox[2] + margin * this._cellSize,
      bbox[3] + margin * this._cellSize,
    ];
  }
}
