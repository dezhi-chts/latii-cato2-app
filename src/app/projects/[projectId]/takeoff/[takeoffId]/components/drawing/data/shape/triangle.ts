import { BaseFrame } from "../baseFrame";
import { IPointPostion } from "../../datas";
import triangleUntil from "../../until/triangleUntil";
import { HorizontalLineWindow, VerticalLineWindow } from "./line";

// Update IPointPostion interface or create a new one
interface IVertexPosition extends IPointPostion {
  id: string;
}

export interface ITriangleWindow {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lineWidth: number;
  containerVertex: Array<IVertexPosition>;
  // contentVertex: Array<IPointPostion>;
  // lines: Array<ILine>;
}

export class TriangleWindow extends BaseFrame {
  points: Array<IVertexPosition> = [];
  angles: number[] = [0, 0, 0];
  lineElements: Array<HorizontalLineWindow | VerticalLineWindow> = [];

  constructor(lineWidth: number, params: any) {
    super(lineWidth, { ...params, ...params.virtualFrame });
    this.type = "Triangle";
    this.update(params, true);
    // this.updateFrameByVertex(true);
    // this.updateAngles();
  }

  updateFrameByVertex(init?: boolean) {
    if (this.flipY) {
      this.points = [
        {
          id: `${this.id}-vertex-0`,
          x: this.virtualFrame.x,
          y: this.virtualFrame.y,
        },
        {
          id: `${this.id}-vertex-1`,
          x: this.virtualFrame.x + this.virtualFrame.width,
          y: this.virtualFrame.y,
        },
        {
          id: `${this.id}-vertex-2`,
          x: this.virtualFrame.x + this.virtualFrame.width / 2,
          y: this.virtualFrame.y + this.virtualFrame.height,
        },
      ];
    } else {
      this.points = [
        {
          id: `${this.id}-vertex-0`,
          x: this.virtualFrame.x,
          y: this.virtualFrame.y + this.virtualFrame.height,
        },
        {
          id: `${this.id}-vertex-1`,
          x: this.virtualFrame.x + this.virtualFrame.width,
          y: this.virtualFrame.y + this.virtualFrame.height,
        },
        {
          id: `${this.id}-vertex-2`,
          x: this.virtualFrame.x + this.virtualFrame.width / 2,
          y: this.virtualFrame.y,
        },
      ];
    }

    this.updateLines(init);
    this.updateAngles();
  }

  move(dx: number, dy: number) {
    super.move(dx, dy);
    this.updateLines();
    // this.virtualFrame.x += dx;
    // this.virtualFrame.y += dy;
    // this.points = this.points.map(vertex => ({
    //     ...vertex,
    //     x: vertex.x + dx,
    //     y: vertex.y + dy
    // }));
    // this.contentPoints = this.contentPoints.map(vertex => ({
    //     x: vertex.x + dx,
    //     y: vertex.y + dy
    // }));
  }

  updateBoundingBox() {
    return {
      x: this.virtualFrame.x,
      y: this.virtualFrame.y,
      width: this.virtualFrame.width,
      height: this.virtualFrame.height,
    };
  }

  update(params: Partial<ITriangleWindow>, init?: boolean) {
    if (init) {
      super.update(params, init);
      this.updateFrameByVertex(init);
      return;
    }
    const originalX = this.virtualFrame.x;
    const originalY = this.virtualFrame.y;
    const originalWidth = this.virtualFrame.width;
    const originalHeight = this.virtualFrame.height;

    super.update(params);

    const widthRatio =
      params.width !== undefined && originalWidth !== 0
        ? params.width / originalWidth
        : 1;
    const heightRatio =
      params.height !== undefined && originalHeight !== 0
        ? params.height / originalHeight
        : 1;

    const dx = params.x !== undefined ? params.x - originalX : 0;
    const dy = params.y !== undefined ? params.y - originalY : 0;

    if ((dx !== 0 || dy !== 0) && widthRatio === 1 && heightRatio === 1) {
      this.move(dx, dy);
      return;
    }

    const newPoints = [...this.points];
    for (let i = 0; i < this.points.length; i++) {
      const relX = (this.points[i].x - originalX) / originalWidth;
      const relY = (this.points[i].y - originalY) / originalHeight;

      const newX =
        (params.x !== undefined ? params.x : originalX) +
        (params.width !== undefined ? params.width : originalWidth) * relX;
      const newY =
        (params.y !== undefined ? params.y : originalY) +
        (params.height !== undefined ? params.height : originalHeight) * relY;

      newPoints[i] = {
        ...this.points[i],
        x: newX,
        y: newY,
      };
    }
    this.points = newPoints;

    this.updateLines();
    this.updateAngles();
  }

  /**
   * Modify the angle of the specified vertice
   * @param vertexIndex  (0, 1, 2)
   * @param newAngleDegrees
   */
  updateVertexAngle(vertexIndex: number, newAngleDegrees: number) {
    if (vertexIndex < 0 || vertexIndex >= 3) {
      console.error("Invalid vertex index");
      return;
    }

    const baseVertex = this.points[vertexIndex];
    const prevIndex = (vertexIndex + 2) % 3;
    const nextIndex = (vertexIndex + 1) % 3;
    const prevVertex = this.points[prevIndex];

    const angleRad = (newAngleDegrees * Math.PI) / 180;
    if (angleRad <= 0 || angleRad >= Math.PI) {
      console.error("Invalid angle, must be between 0 and 180 degrees");
      return;
    }

    // 计算向量 base -> prev
    const vecA = {
      x: prevVertex.x - baseVertex.x,
      y: prevVertex.y - baseVertex.y,
    };

    const lengthA = Math.sqrt(vecA.x ** 2 + vecA.y ** 2);
    if (lengthA === 0) {
      console.error("Previous vertex is too close to base");
      return;
    }

    // 单位向量
    const unitA = {
      x: vecA.x / lengthA,
      y: vecA.y / lengthA,
    };

    // 旋转单位向量（逆时针方向）
    const sin = Math.sin(angleRad);
    const cos = Math.cos(angleRad);
    const rotated = {
      x: unitA.x * cos - unitA.y * sin,
      y: unitA.x * sin + unitA.y * cos,
    };

    // 假设边长与 base -> prev 相等（或自定义一个长度）
    const sideLength = lengthA;

    // 计算新的 nextVertex 坐标
    const newNextVertex = {
      x: baseVertex.x + rotated.x * sideLength,
      y: baseVertex.y + rotated.y * sideLength,
    };

    // 更新顶点
    this.points[nextIndex] = {
      ...this.points[nextIndex],
      ...newNextVertex,
    };

    this.updateVirtualFrameByPoints();
    this.updateLines();
    this.updateAngles();
  }


    /**
     * 通过输入框输入角度，调整三角形目标顶点角度（基准边固定+同侧调整+角度优先）
     * 核心约束：
     * 1. 基准边由目标顶点的相邻边中"min(dx, dy)最小"的边确定，位置和长度永久不变
     * 2. 仅调整第三点（非基准边顶点），且始终保持在基准边同侧
     * 3. 角度必须达标后才进行面积补偿，补偿后角度变化则取消
     * @param {number} targetVertexIndex 目标顶点索引（0/1/2）
     * @param {number} targetAngle 目标角度（度，0.1~179.9）
     * @param {number} areaStability 面积补偿强度（0-1，1=最大补偿）
     */
    adjustTriangleAngle(targetVertexIndex:number, targetAngle:number, areaStability = 1) {
        /**
         * 获取目标顶点的相邻顶点索引
         */
        function getAdjacentIndices(targetIndex:number) {
            switch (targetIndex) {
                case 0: return [1, 2];
                case 1: return [0, 2];
                case 2: return [0, 1];
                default: throw new Error("无效索引");
            }
        }

        // 输入验证
        if (!this.points || this.points.length !== 3) throw new Error("需传入3个顶点");
        if (targetVertexIndex < 0 || targetVertexIndex > 2) throw new Error("索引必须为0-2");
        areaStability = Math.max(0, Math.min(1, areaStability));
        targetAngle = Math.max(0.1, Math.min(179.9, targetAngle));

        // 复制顶点（避免修改原数据）
        const newPoints = [...this.points.map(p => ({ ...p }))];
        const targetV = newPoints[targetVertexIndex]; // 目标顶点（角度所在顶点）

        // --------------------------
        // 步骤1：确定基准边（严格不变）
        // --------------------------
        const [adj1Index, adj2Index] = getAdjacentIndices(targetVertexIndex); // 目标顶点的两个相邻顶点索引
        const adj1 = newPoints[adj1Index]; // 相邻顶点1
        const adj2 = newPoints[adj2Index]; // 相邻顶点2

        // 计算两条相邻边的min(dx, dy)
        const edge1 = {
            dx: Math.abs(adj1.x - targetV.x),
            dy: Math.abs(adj1.y - targetV.y)
        };
        const edge2 = {
            dx: Math.abs(adj2.x - targetV.x),
            dy: Math.abs(adj2.y - targetV.y)
        };
        const edge1Min = Math.min(edge1.dx, edge1.dy);
        const edge2Min = Math.min(edge2.dx, edge2.dy);

        // 确定基准边（min值更小的边）和第三点（待调整的点）
        let baseAdj, thirdPoint, thirdPointIndex;
        if (edge1Min <= edge2Min) {
            baseAdj = adj1; // 基准边：目标顶点-相邻顶点1（位置不变）
            thirdPoint = adj2; // 第三点：相邻顶点2（待调整）
            thirdPointIndex = adj2Index;
        } else {
            baseAdj = adj2; // 基准边：目标顶点-相邻顶点2（位置不变）
            thirdPoint = adj1; // 第三点：相邻顶点1（待调整）
            thirdPointIndex = adj1Index;
        }

        // --------------------------
        // 步骤2：记录第三点原始侧（必须保持）
        // --------------------------
        // 用基准边（targetV-baseAdj）判断第三点的原始侧（叉积符号）
        const baseVector = { x: baseAdj.x - targetV.x, y: baseAdj.y - targetV.y };
        const thirdVectorOriginal = { x: thirdPoint.x - targetV.x, y: thirdPoint.y - targetV.y };
        const originalSideSign = Math.sign(baseVector.x * thirdVectorOriginal.y - baseVector.y * thirdVectorOriginal.x);

        // --------------------------
        // 步骤3：调整第三点位置至目标角度
        // --------------------------
        // 计算目标角度对应的第三点新位置
        let newThirdPoint = triangleUntil.calculateTargetPosition(targetV, baseAdj, thirdPoint, targetAngle);

        // 确保新位置在基准边原始侧（反向则镜像）
        const thirdVectorNew = { x: newThirdPoint.x - targetV.x, y: newThirdPoint.y - targetV.y };
        const newSideSign = Math.sign(baseVector.x * thirdVectorNew.y - baseVector.y * thirdVectorNew.x);
        if (newSideSign !== originalSideSign) {
            newThirdPoint = triangleUntil.mirrorOverBaseEdge(targetV, baseAdj, newThirdPoint);
        }

        // 强制角度达标（处理计算误差，确保≤0.1°）
        newThirdPoint = triangleUntil.fineTuneAngle(targetV, baseAdj, newThirdPoint, targetAngle);

        // 更新第三点
        newPoints[thirdPointIndex] = {
            ...newPoints[thirdPointIndex],
            x:newThirdPoint.x,
            y:newThirdPoint.y
        };

        // --------------------------
        // 步骤4：验证角度是否达标
        // --------------------------
        const currentAngle = triangleUntil.calculateAngle(targetV, baseAdj, newThirdPoint);
        if (Math.abs(currentAngle - targetAngle) > 0.1) {
            console.warn(`角度未达标：目标${targetAngle}°，实际${currentAngle.toFixed(2)}°`);
            return; // 角度不达标，不更新三角形
        }

        // --------------------------
        // 步骤5：面积补偿（角度达标后）
        // --------------------------
        if (areaStability > 0) {
            const originalArea = triangleUntil.calculateTriangleArea(targetV, baseAdj, thirdPoint); // 原始面积
            const compensatedThirdPoint = triangleUntil.compensateAreaByHeight(
                targetV, baseAdj, newThirdPoint, originalArea
            );

            // 验证补偿后角度是否变化
            const compensatedAngle = triangleUntil.calculateAngle(targetV, baseAdj, compensatedThirdPoint);
            if (Math.abs(compensatedAngle - targetAngle) <= 0.1) {
                newPoints[thirdPointIndex] = {
                    ...newPoints[thirdPointIndex],
                    x:compensatedThirdPoint.x,
                    y:compensatedThirdPoint.y
                } // 补偿有效
            } else {
                console.warn("面积补偿导致角度偏移，已取消补偿");
            }
        }

        this.points = newPoints;
        this.updateVirtualFrameByPoints();
        this.updateLines(); 
        this.updateAngles();
    }

  getPath(vertices: IPointPostion[]): string {
    if (!vertices.length || vertices.length < 3) return "";
    return `M ${vertices[0].x} ${vertices[0].y} 
                L ${vertices[1].x} ${vertices[1].y} 
                L ${vertices[2].x} ${vertices[2].y} Z`;
  }

  updateLines(init?: boolean) {
    if (init) {
      this.lines = [];
      this.points.forEach((vertex, index: number) => {
        const nextIndex = (index + 1) % 3;
        this.lines.push({
          id: `${this.id}-line-${index}`,
          startPoint: vertex,
          endPoint: this.points[nextIndex],
        });
      });
      return;
    }
    if (!this.lines) return;

    for (let i = 0; i < 3; i++) {
      const nextIndex = (i + 1) % 3;
      if (!this.lines[i]) return;
      this.lines[i] = {
        ...this.lines[i],
        startPoint: this.points[i],
        endPoint: this.points[nextIndex],
        hidden: false,
      };
    }
  }

  updateSingleVertex(index: number, newPos: IPointPostion) {
    if (index >= this.points.length) return;

    this.points[index] = {
      ...this.points[index],
      x: newPos.x,
      y: newPos.y,
    };
    this.updateVirtualFrameByPoints();

    this.updateLines();
    this.updateAngles();
  }

  updateVertex(vertexs: IPointPostion[]) {
    this.points.forEach((vertex: IPointPostion, index) => {
      this.updateSingleVertex(index, vertexs[index]);
      // vertex.x = vertexs[index].x
      // vertex.y = vertexs[index].y
    });
  }

  updateVirtualFrameByPoints() {
    const bounds = this.points.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxY: Math.max(acc.maxY, point.y),
      }),
      {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
      }
    );

    this.virtualFrame.x = bounds.minX;
    this.virtualFrame.y = bounds.minY;
    this.virtualFrame.width = bounds.maxX - bounds.minX;
    this.virtualFrame.height = bounds.maxY - bounds.minY;
  }

  updateAngles() {
    this.angles = triangleUntil.calculateTriangleAngles(this.points);
  }

  updateLineEle(line: any, remove: boolean = false) {
    const index = this.lineElements.findIndex(
      (elem: any) => elem.id === line.id
    );

    if (remove) {
      index > -1 && this.lineElements.splice(index, 1);
      return;
    }
    if (index >= 0) {
      this.lineElements[index] = line;
    } else {
      this.lineElements.push(line);
    }
  }

  override updateFrameBasedOnCutLines() {
    const update = super.updateFrameBasedOnCutLines();
    console.log(this.lines);
    return update;
  }
}
