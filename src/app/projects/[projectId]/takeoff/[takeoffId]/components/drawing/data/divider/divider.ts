import { BaseData } from "../baseData";
import { IPointPostion } from "../../datas";

export class SDLHorizontal extends BaseData {
    points: IPointPostion[] = [];
    startElement:any
    endElement:any

    pocketWallOverlap: Map<string, IPocketWallOverlap> = new Map();
    
    constructor(params: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        virtualFrame?: any;
    }) {
        super(params);
        this.type = "SDL-h";
        this.style = {
            color: {
                fill: '#B8B8B8',
                border: '#B8B8B8'
            }
        };
        this.updatePoints();
    }
    
    update(params: any, init?: boolean) {
        super.update(params, init);
        this.updatePoints();
    }
    
    move(dx: number, dy: number) {
        super.move(dx, dy);
        this.updatePoints();
    }
    
    updatePoints() {
        const { x, y, width, height } = this.virtualFrame;
        this.points = [
            { x, y },
            { x: x + width, y },
            // { x: x + width, y: y + height },
            // { x, y: y + height }
        ];
    }
    
    getLines() {
        const { x, y, width, height } = this.virtualFrame;
        return [
            { x1: x, y1: y, x2: x + width, y2: y },
            // { x1: x + width, y1: y, x2: x + width, y2: y + height },
            // { x1: x + width, y1: y + height, x2: x, y2: y + height },
            // { x1: x, y1: y + height, x2: x, y2: y }
        ];
    }

    // 设置pocketwall重叠区域
    setPocketWallOverlap(overlaps: IPocketWallOverlap[]) {
        overlaps.forEach(overlap => {
            try{
                this.pocketWallOverlap.set(overlap.pocketWallId, overlap);
            }catch(error){
                console.log('######## SDLHorizontal setPocketWallOverlap error');
            }
            
        })
    }

    // 清除pocketwall重叠区域
    clearPocketWallOverlap() {
        try{
            this.pocketWallOverlap.clear();
        }catch(error){
            console.log('######## SDLHorizontal clearPocketWallOverlap error');
        }
    }

    // 获取pocketwall重叠区域
    getPocketWallOverlap(pocketWallId:string): IPocketWallOverlap | undefined {
        try{
            return this.pocketWallOverlap.get(pocketWallId);
        }catch(error){
            console.log('######## SDLHorizontal getPocketWallOverlap error');
            return undefined;
        }
    }

    // 获取所有pocketwall重叠区域
    getAllPocketWallOverlaps(): IPocketWallOverlap[] {
        try{
            return Array.from(this.pocketWallOverlap.values());
        }catch(error){
            console.log('######## SDLHorizontal getAllPocketWallOverlaps error');
            return [];
        }
    }
}

export class SDLVertical extends BaseData {
    points: IPointPostion[] = [];
    startElement:any
    endElement:any

    pocketWallOverlap: Map<string, IPocketWallOverlap> = new Map();
    
    constructor(params: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        virtualFrame?: any;
    }) {
        super(params);
        this.type = "SDL-v";
        this.style = {
            color: {
                fill: '#B8B8B8',
                border: '#B8B8B8'
            }
        };
        this.updatePoints();
    }
    
    update(params: any, init?: boolean) {
        super.update(params, init);
        this.updatePoints();
    }
    
    move(dx: number, dy: number) {
        super.move(dx, dy);
        this.updatePoints();
    }
    
    updatePoints() {
        const { x, y, width, height } = this.virtualFrame;
        this.points = [
            { x, y },
            { x, y: y + height },
            // { x: x + width, y },
            // { x: x + width, y: y + height },
        ];
    }
    
    getLines() {
        const { x, y, width, height } = this.virtualFrame;
        return [
            { x1: x, y1: y, x2: x, y2: y+ height },
            // { x1: x + width, y1: y, x2: x + width, y2: y + height },
            // { x1: x + width, y1: y + height, x2: x, y2: y + height },
            // { x1: x, y1: y + height, x2: x, y2: y }
        ];
    }

    // 设置pocketwall重叠区域
    setPocketWallOverlap(overlaps: IPocketWallOverlap[]) {
        overlaps.forEach(overlap => {
            try{
                this.pocketWallOverlap.set(overlap.pocketWallId, overlap);
            }catch(error){
                console.log('######## SDLVertical setPocketWallOverlap error');
            }
            
        })
    }

    // 清除pocketwall重叠区域
    clearPocketWallOverlap() {
        try{
            this.pocketWallOverlap.clear();
        }catch(error){
            console.log('######## SDLVertical clearPocketWallOverlap error');
        }
    }

    // 获取pocketwall重叠区域
    getPocketWallOverlap(pocketWallId:string): IPocketWallOverlap | undefined {
        try{
            return this.pocketWallOverlap.get(pocketWallId);
        }catch(error){
            console.log('######## SDLVertical getPocketWallOverlap error');
            return undefined;
        }
    }

    // 获取所有pocketwall重叠区域
    getAllPocketWallOverlaps(): IPocketWallOverlap[] {
        try{
            return Array.from(this.pocketWallOverlap.values());
        }catch(error){
            console.log('######## SDLVertical getAllPocketWallOverlaps error');
            return [];
        }
    }
}

export class TDLHorizontal extends BaseData {
    points: IPointPostion[] = [];
    startElement:any
    endElement:any
    pocketWallOverlap: Map<string, IPocketWallOverlap> = new Map();
    
    constructor(params: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        virtualFrame?: any;
    }) {
        super(params);
        this.type = "TDL-h";
        // 设置默认淡蓝色
        this.style = {
            color: {
                fill: '#E1E1E1',
                border: '#E1E1E1'
            }
        };
        this.updatePoints();
    }
    
    update(params: any, init?: boolean) {
        super.update(params, init);
        this.updatePoints();
    }
    
    move(dx: number, dy: number) {
        super.move(dx, dy);
        this.updatePoints();
    }
    
    updatePoints() {
        const { x, y, width, height } = this.virtualFrame;
        this.points = [
            { x, y },
            { x: x + width, y },
            // { x: x + width, y: y + height },
            // { x, y: y + height }
        ];
    }
    
    getLines() {
        const { x, y, width, height } = this.virtualFrame;
        return [
            { x1: x, y1: y, x2: x + width, y2: y },
            // { x1: x + width, y1: y, x2: x + width, y2: y + height },
            // { x1: x + width, y1: y + height, x2: x, y2: y + height },
            // { x1: x, y1: y + height, x2: x, y2: y }
        ];
    }

    // 设置pocketwall重叠区域
    setPocketWallOverlap(overlaps: IPocketWallOverlap[]) {
        overlaps.forEach(overlap => {
            try{
                this.pocketWallOverlap.set(overlap.pocketWallId, overlap);
            }catch(error){
                console.log('######## TDLHorizontal setPocketWallOverlap error');
            }
            
        })
    }

    // 清除pocketwall重叠区域
    clearPocketWallOverlap() {
        try{
            this.pocketWallOverlap.clear();
        }catch(error){
            console.log('######## TDLHorizontal clearPocketWallOverlap error');
        }
    }

    // 获取pocketwall重叠区域
    getPocketWallOverlap(pocketWallId:string): IPocketWallOverlap | undefined {
        try{
            return this.pocketWallOverlap.get(pocketWallId);
        }catch(error){
            console.log('######## TDLHorizontal getPocketWallOverlap error');
            return undefined;
        }
    }

    // 获取所有pocketwall重叠区域
    getAllPocketWallOverlaps(): IPocketWallOverlap[] {
        try{
            return Array.from(this.pocketWallOverlap.values());
        }catch(error){
            console.log('######## TDLHorizontal getAllPocketWallOverlaps error');
            return [];
        }
    }
}

export class TDLVertical extends BaseData {
    points: IPointPostion[] = [];
    startElement:any
    endElement:any

    pocketWallOverlap: Map<string, IPocketWallOverlap> = new Map();
    
    constructor(params: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        virtualFrame?: any;
    }) {
        super(params);
        this.type = "TDL-v";
        this.style = {
            color: {
                fill: '#E1E1E1',
                border: 'rgba(225, 225, 225)'
            }
        };
        this.updatePoints();
    }
    
    update(params: any, init?: boolean) {
        super.update(params, init);
        this.updatePoints();
    }
    
    move(dx: number, dy: number) {
        super.move(dx, dy);
        this.updatePoints();
    }
    
    updatePoints() {
        const { x, y, width, height } = this.virtualFrame;
        this.points = [
            { x, y },
            { x, y: y + height },
            // { x: x + width, y },
            // { x: x + width, y: y + height },
        ];
    }
    
    getLines() {
        const { x, y, width, height } = this.virtualFrame;
        return [
            { x1: x, y1: y, x2: x + width, y2: y + height },
            // { x1: x + width, y1: y, x2: x + width, y2: y + height },
            // { x1: x + width, y1: y + height, x2: x, y2: y + height },
            // { x1: x, y1: y + height, x2: x, y2: y }
        ];
    }

    // 设置pocketwall重叠区域
    setPocketWallOverlap(overlaps: IPocketWallOverlap[]) {
        overlaps.forEach(overlap => {
            try{
                this.pocketWallOverlap.set(overlap.pocketWallId, overlap);
            }catch(error){
                console.log('######## TDLVertical setPocketWallOverlap error');
            }
            
        })
    }

    // 清除pocketwall重叠区域
    clearPocketWallOverlap() {
        try{
            this.pocketWallOverlap.clear();
        }catch(error){
            console.log('######## TDLVertical clearPocketWallOverlap error');
        }
    }

    // 获取pocketwall重叠区域
    getPocketWallOverlap(pocketWallId:string): IPocketWallOverlap | undefined {
        try{
            return this.pocketWallOverlap.get(pocketWallId);
        }catch(error){
            console.log('######## TDLVertical getPocketWallOverlap error');
            return undefined;
        }
    }

    // 获取所有pocketwall重叠区域
    getAllPocketWallOverlaps(): IPocketWallOverlap[] {
        try{
            return Array.from(this.pocketWallOverlap.values());
        }catch(error){
            console.log('######## TDLVertical getAllPocketWallOverlaps error');
            return [];
        }
    }
} 