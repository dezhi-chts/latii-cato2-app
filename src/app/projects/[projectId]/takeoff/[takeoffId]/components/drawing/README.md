# Drawing 组件

一个功能强大的 React 绘图组件，用于绘制和管理各种形状、框架和窗户布局的设计工具。

## 属性

### initialData

- 类型: `Array<any>`
- 必填: `false`
- 描述: 初始绘图数据
- 默认值: `[]`

### onChange

- 类型: `(data: Array<BaseData>, type: ChangeType) => void`
- 必填: `false`
- 描述: 当绘图内容发生变化时的回调函数

### onSelectChange

- 类型: `(elements: any[]) => void`
- 必填: `false`
- 描述: 当选择的元素发生变化时的回调函数

### onDrop

- 类型: `(value: any) => void`
- 必填: `false`
- 描述: 当拖放元素时的回调函数

### onChangeUnit

- 类型: `(value: any) => void`
- 必填: `false`
- 描述: 当单位变化时的回调函数

### getGroupZones

- 类型: `(value: any) => {}`
- 必填: `false`
- 描述: 获取组区域信息的回调函数

### from

- 类型: `'quote' | 'design'`
- 必填: `false`
- 描述: 组件的使用场景
- 默认值: `'design'`

## 方法

### importData

导入绘图数据

```typescript
importData: (data: BaseData) => void;
```

### exportData

导出当前绘图数据

```typescript
exportData: () => any;
```

### exportImage

导出绘图为图片

```typescript
exportImage: () => Promise<IImageData>;

interface IImageData {
  dataURL?: string;
  width?: number;
  height?: number;
}
```

### exportElementImage

导出指定元素为图片

```typescript
exportElementImage: (elementId: string) => Promise<IImageData>;
```

### addElement

添加新元素

```typescript
addElement: (params: {
    id: string;
    category: number;
    type: number;
    open?: string;
    width?: number;
    height?: number;
}) => void;
```

### removeElement

删除选中元素

```typescript
removeElement: () => void;
```

### selectElementById

通过 ID 选择元素

```typescript
selectElementById: (id: string) => void;
```

### selectElementByUnitId

通过单元 ID 选择元素

```typescript
selectElementByUnitId: (id: string) => void;
```

### updateElement

更新元素属性

```typescript
updateElement: (id: string, params: any) => void;
```

### clearElements

清除所有元素

```typescript
clearElements: () => void;
```

### setDragMode

设置拖拽模式

```typescript
setDragMode: (mode: 'drag' | 'select' | null) => void;
```

### merge

合并选中的元素

```typescript
merge: () => void;
```

### unmerge

拆分组合元素

```typescript
unmerge: () => void;
```

### setRemoveLineMode

设置移除线条模式

```typescript
setRemoveLineMode: (enabled: boolean) => void;
```

### setPoints

设置点位置

```typescript
setPoints: (id: string, points: IPointPostion[]) => void;
```

### getLines

获取所有线条

```typescript
getLines: () => { [key: string]: ILine[] };
```

### updateAreas

更新区域信息

```typescript
updateAreas: (areas: any[]) => void;
```

### undo

撤销操作

```typescript
undo: () => void;
```

### redo

重做操作

```typescript
redo: () => void;
```

### canUndo

检查是否可以撤销

```typescript
canUndo: () => boolean;
```

### canRedo

检查是否可以重做

```typescript
canRedo: () => boolean;
```

### render

渲染绘图

```typescript
render: (renderSettings: any) => void;
```

### clearZones

清除所有区域

```typescript
clearZones: () => void;
```

### selectAll

选择所有元素

```typescript
selectAll: () => void;
```

### importTemplate

导入模板

```typescript
importTemplate: (json: string, refresh: boolean, code: string) => void;
```

### handleZoom

处理缩放

```typescript
handleZoom: (type: 'in' | 'out') => void;
```

### updateUnit

更新单元属性

```typescript
updateUnit: (id: string, params: any) => void;
```

### exportUnits

导出所有单元

```typescript
exportUnits: () => void;
```

### renderUnit

渲染单元

```typescript
renderUnit: (unitId: string, setMode: any) => void;
```

### sketchUnit

绘制单元草图

```typescript
sketchUnit: (unitId: string, setMode: any) => void;
```

## 使用示例

```tsx
import Drawing from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/drawing";
import { WindowDrawerRef } from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/drawing";
import { ChangeType } from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/drawing/datas";

const App = () => {
  const drawerRef = useRef<WindowDrawerRef>(null);

  const handleChange = (data: Array<any>, type: ChangeType) => {
    console.log("Drawing changed:", data, type);
  };

  const handleSelectChange = (elements: any[]) => {
    console.log("Selection changed:", elements);
  };

  const handleExport = () => {
    const data = drawerRef.current?.exportData();
    console.log("Exported data:", data);
  };

  const handleExportImage = async () => {
    const imageData = await drawerRef.current?.exportImage();
    console.log("Exported image:", imageData);
  };

  const handleAddElement = () => {
    drawerRef.current?.addElement({
      id: "unique-id",
      category: 1,
      type: 47,
      open: "left",
      width: 500,
      height: 400,
    });
  };

  const handleRemoveElement = () => {
    drawerRef.current?.removeElement();
  };

  const handleMerge = () => {
    drawerRef.current?.merge();
  };

  const handleUnmerge = () => {
    drawerRef.current?.unmerge();
  };

  const handleUndo = () => {
    if (drawerRef.current?.canUndo()) {
      drawerRef.current?.undo();
    }
  };

  const handleRedo = () => {
    if (drawerRef.current?.canRedo()) {
      drawerRef.current?.redo();
    }
  };

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <Drawing
        ref={drawerRef}
        initialData={[]}
        onChange={handleChange}
        onSelectChange={handleSelectChange}
        from="design"
      />
      <div>
        <button onClick={handleExport}>导出数据</button>
        <button onClick={handleExportImage}>导出图片</button>
        <button onClick={handleAddElement}>添加元素</button>
        <button onClick={handleRemoveElement}>删除元素</button>
        <button onClick={handleMerge}>合并元素</button>
        <button onClick={handleUnmerge}>拆分元素</button>
        <button onClick={handleUndo}>撤销</button>
        <button onClick={handleRedo}>重做</button>
      </div>
    </div>
  );
};

export default App;
```

## 主要类型定义

```typescript
// 组件属性
interface WindowDrawerProps {
  initialData?: Array<any>;
  onChange?: (data: Array<BaseData>, type: ChangeType) => void;
  onDrop?: (value: any) => void;
  onChangeUnit?: (value: any) => void;
  loading?: () => void;
  onSelectChange?: (elements: any[]) => void;
  getGroupZones?: (value: any) => {};
  from?: "quote" | "design";
}

// 区域信息
interface IZone {
  points: IPointPostion[];
  label: number;
  area: number;
  centroid: number[];
  segments: Array<ISegment>;
  color?: string;
  border?: any;
  show_id?: number;
  sashConfigs?: ISashConfig[];
  sashPositions: any[];
  operations?: BaseOperation[];
  dividers?: Array<any>;
  elementId?: string;
  is_clockwise?: boolean;
  lines?: ISegment[];
  inner?: {
    points: IPointPostion[];
    segments: ISegment[];
  };
}

// 点位置
interface IPointPostion {
  x: number;
  y: number;
}

// 线段信息
interface ISegment {
  id: string;
  start: IPointPostion;
  end: IPointPostion;
  isArc?: boolean;
  center?: IPointPostion;
  radius?: number;
  weight?: number;
  is_clockwise?: any;
  start_angle?: any;
  end_angle?: any;
  middle_point?: any;
}

// 图片数据
interface IImageData {
  dataURL?: string;
  width?: number;
  height?: number;
}

// 变更类型
type ChangeType = "divider" | "change";

// 形状类型
enum ShapeType {
  Rectangle = "Rectangle",
  LineH = "Line-h",
  LineV = "Line-v",
  ArchH = "Arch-h",
  ArchV = "Arch-v",
  Triangle = "Triangle",
  Group = "Group",
}
```
