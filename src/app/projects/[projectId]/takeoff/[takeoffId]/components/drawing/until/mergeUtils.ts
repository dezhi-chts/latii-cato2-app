import { ILine } from "../components/midting";
import { Frame } from "../data/shape/frame";
import lineUntil from "./lineUntil";

class MergeUtils {

    // calculateMergedBounds = (frame1: Frame, frame2: Frame) => {
    //     const x = Math.min(frame1.x, frame2.x);
    //     const y = Math.min(frame1.y, frame2.y);
    //     const right = Math.max(frame1.x + frame1.width, frame2.x + frame2.width);
    //     const bottom = Math.max(frame1.y + frame1.height, frame2.y + frame2.height);
    //
    //     return {
    //         x: Math.min(elem1.element.x, elem2.element.x),
    //         y: Math.min(elem1.element.y, elem2.element.y),
    //         width: isHorizontalMerge
    //             ? elem1.element.width + elem2.element.width
    //             : Math.max(elem1.element.width, elem2.element.width),
    //         height: isHorizontalMerge
    //             ? Math.max(elem1.element.height, elem2.element.height)
    //             : elem1.element.height + elem2.element.height
    //     };
    // };

    checkMergableEdges = (edge1: any, edge2: any) => {
        // if(edge1.id === edge2.id) return false;
        //
        // // check for parallel and overlapping images
        // const isOverlapping = lineUntil.areParallelAndOverlapping(edge1, edge2);
        // if (!isOverlapping) return false;
        //
        // // check the edge distance
        // const distance = lineUntil.getDistance(edge1.centerPoint, edge2.centerPoint);
        //
        // // check both vertical and horizontal lines
        // if (lineUntil.isVertical(edge1) || lineUntil.isHorizontal(edge1)) {
        //     return Math.abs(distance) < 1;
        // }

        return false;
    };

    findMergingEdge(frame1: Frame, frame2: Frame): ILine | null {
        // if (!frame1 || !frame2) return null;
        //
        // for (const edge1 of frame1.lines) {
        //     for (const edge2 of frame2.lines) {
        //         if (this.areEdgesMergeable(edge1, edge2)) {
        //             return edge1;
        //         }
        //     }
        // }

        return null;
    }

    // private areEdgesMergeable(edge1: ILine, edge2: ILine): boolean {
        // if (!lineUntil.areParallelAndOverlapping(edge1, edge2)) {
        //     return false;
        // }
        //
        // if (edge1.centerPoint && edge2.centerPoint) {
        //     const distance = lineUntil.getDistance(edge1.centerPoint, edge2.centerPoint);
        //     return Math.abs(distance) < 1;
        // }
        //
        // const distance = this.getMinimumEdgeDistance(edge1, edge2);
        // return distance < 1;
    // }

    // private getMinimumEdgeDistance(edge1: ILine, edge2: ILine): number {
        // if (!edge1.lineInfo || !edge2.lineInfo) return Infinity;
        //
        // if (lineUntil.isVertical(edge1.lineInfo)) {
        //     return Math.abs(edge1.lineInfo.x1 - edge2.lineInfo.x1);
        // }
        //
        // if (lineUntil.isHorizontal(edge1.lineInfo)) {
        //     return Math.abs(edge1.lineInfo.y1 - edge2.lineInfo.y1);
        // }
        //
        // const dx = edge2.lineInfo.x1 - edge1.lineInfo.x1;
        // const dy = edge2.lineInfo.y1 - edge1.lineInfo.y1;
        // const length = Math.sqrt(dx * dx + dy * dy);
        //
        // const slope1 = (edge1.lineInfo.y2 - edge1.lineInfo.y1) / (edge1.lineInfo.x2 - edge1.lineInfo.x1);
        // const slope2 = (edge2.lineInfo.y2 - edge2.lineInfo.y1) / (edge2.lineInfo.x2 - edge2.lineInfo.x1);
        //
        // if (Math.abs(slope1 - slope2) < 0.001) {
        //     const A = slope1;
        //     const B = -1;
        //     const C = edge1.lineInfo.y1 - slope1 * edge1.lineInfo.x1;
        //     return Math.abs(A * edge2.lineInfo.x1 + B * edge2.lineInfo.y1 + C) / Math.sqrt(A * A + B * B);
        // }
        //
        // return Infinity;
    // }

    checkCanMerge = (edge: any, frameId: string, elements: Array<any>) => {
        for (const element of elements) {
            if (element.id === frameId) continue;
            for (const otherEdge of (element.element as Frame).lines) {
                if (this.checkMergableEdges(edge, otherEdge)) {
                    return true;
                }
            }
        }
        return false;
    };

    checkCanUnmerge = (lineId: string, elements:any) => {
        for (const element of elements) {
            if ((element.element as Frame).regionDivision.midtings.some((m:any) => m.id === lineId)) {
                return element;
            }
        }
        return undefined;
    };

}

const mergeUtils = new MergeUtils();
export default mergeUtils;