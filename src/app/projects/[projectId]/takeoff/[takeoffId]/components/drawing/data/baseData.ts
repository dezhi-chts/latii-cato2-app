// Create a new file for BaseData
export interface IStyle {
    color: {
        fill: string;
    }
}

export interface IVertualFrame {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface IShapeData {
    id: string;
    virtualFrame: IVertualFrame,
    style: IStyle;
    type: string;
}

export class BaseData implements IShapeData {
    id = ''
    virtualFrame = {
        x:0,
        y: 0,
        width: 0,
        height: 0,
    }
    zIndex: number = 0;
    type = '';
    style = {
        color: {
            border: '#333',
            fill: 'transparent',
            select: '#00F'
        }
    }

    constructor(params: any) {
        this.id = params.id;
        this.update(params || {}, true);
    }

    move(dx: number, dy: number) {
        this.virtualFrame.x += dx;
        this.virtualFrame.y += dy;
    }

    update(params: any, init?: boolean) {
        if (params.x != undefined) this.virtualFrame.x = params.x;
        if (params.y != undefined) this.virtualFrame.y = params.y;
        if (params.width != undefined) this.virtualFrame.width = params.width;
        if (params.height != undefined) this.virtualFrame.height = params.height;
    }
} 