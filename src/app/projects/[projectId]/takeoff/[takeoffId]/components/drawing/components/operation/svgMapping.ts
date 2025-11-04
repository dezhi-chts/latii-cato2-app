import { OperationType } from "../../datas";

export const operationSvgMapping: Record<string, {
  path: string;
  transform?: string;
}> = {
  // 箭头类型
  [OperationType.ARROW_LEFT]: {
    path: '/assets/icons/drawing/Arrow one side.svg',
    transform: 'rotate(0)'
  },
  [OperationType.ARROW_RIGHT]: {
    path: '/assets/icons/drawing/Arrow one side.svg',
    transform: 'rotate(180)'
  },
  [OperationType.ARROW_UP]: {
    path: '/assets/icons/drawing/Arrow one side.svg',
    transform: 'rotate(270)'
  },
  [OperationType.ARROW_DOWN]: {
    path: '/assets/icons/drawing/Arrow one side.svg',
    transform: 'rotate(90)'
  },
  [OperationType.ARROW_LR]: {
    path: '/assets/icons/drawing/Arrow two sides.svg',
  },
  [OperationType.ARROW_TD]: {
    path: '/assets/icons/drawing/Arrow two sides.svg',
    transform: 'rotate(90)'
  },

  // 角度类型
  [OperationType.ANGLE_LEFT]: {
    path: '',
  },
  [OperationType.ANGLE_RIGHT]: {
    path: '',
  },
  [OperationType.ANGLE_UP]: {
    path: '',
  },
  [OperationType.ANGLE_DOWN]: {
    path: '',
  },


  [OperationType.HARDWARE_HL]: {
    path: '/assets/icons/drawing/Hardware [Swing].svg'
  },
  [OperationType.HARDWARE_HR]: {
    path: '/assets/icons/drawing/Hardware [Swing].svg',
    transform: 'rotate(180)'
  },
  [OperationType.HARDWARE_V]: {
    path: '/assets/icons/drawing/verical handle.svg',
    // transform: 'rotate(90)'
  },
  [OperationType.MOTORIZED]: {
    path: '/assets/icons/drawing/Motorized Badge.svg'
  },
  [OperationType.POCKET_WALL]: {
    path: '/assets/icons/drawing/Sliding Pocket Wall.svg'
  },
  [OperationType.MOTO_LEFT]: {
    path: '/assets/icons/drawing/One side Arrow - Motorized.svg',
    transform: 'rotate(0)'
  },
  [OperationType.MOTO_RIGHT]: {
    path: '/assets/icons/drawing/One side Arrow - Motorized.svg',
    transform: 'rotate(180)'
  },
  [OperationType.MOTO_UP]: {
    path: '/assets/icons/drawing/One side Arrow - Motorized.svg',
    transform: 'rotate(270)'
  },
  [OperationType.MOTO_DOWN]: {
    path: '/assets/icons/drawing/One side Arrow - Motorized.svg',
    transform: 'rotate(90)'
  },
  [OperationType.MOTO_LR]: {
    path: '/assets/icons/drawing/Two Side [MOTORIZED].svg'
  },
  [OperationType.MOTO_TD]: {
    path: '/assets/icons/drawing/Two Side [MOTORIZED].svg',
    transform: 'rotate(90)'
  },
  [OperationType.FOLDING]: {
    path: '/assets/icons/drawing/Folding.svg'
  },
  [OperationType.Folding_LEFT]: {
    path: '/assets/icons/drawing/One side Arrow - Folding.svg',
    transform: 'rotate(0)'
  },
  [OperationType.Folding_RIGHT]: {
    path: '/assets/icons/drawing/One side Arrow - Folding.svg',
    transform: 'rotate(180)'
  },
  [OperationType.Folding_UP]: {
    path: '/assets/icons/drawing/One side Arrow - Folding.svg',
    transform: 'rotate(270)'
  },
  [OperationType.Folding_DOWN]: {
    path: '/assets/icons/drawing/One side Arrow - Folding.svg',
    transform: 'rotate(90)'
  },
  [OperationType.Folding_LR]: {
    path: '/assets/icons/drawing/One side Arrow - Folding.svg'
  },
  [OperationType.Folding_TD]: {
    path: '/assets/icons/drawing/One side Arrow - Folding.svg',
    transform: 'rotate(90)'
  },
  [OperationType.PIVOT_V]: {
    path: '/assets/icons/drawing/Vertical Pivot-114.svg'
  },
  [OperationType.PIVOT_H]: {
    path: '/assets/icons/drawing/Horizontal Pivot-115.svg'
  },
  [OperationType.RAIL_2]: {
    path: '/assets/icons/drawing/2 Rail.svg'
  },
  [OperationType.RAIL_4]: {
    path: '/assets/icons/drawing/4 Rail.svg'
  },
  [OperationType.ACTIVE]: {
    path: '/assets/icons/drawing/-_Active.svg'
  },
  [OperationType.INSWING]: {
    path: '/assets/icons/drawing/-_Inswing.svg'
  },
  [OperationType.OUTSWING]: {
    path: '/assets/icons/drawing/-_Outswing.svg'
  },
  [OperationType.PASSIVE]: {
    path: '/assets/icons/drawing/-_Passive.svg'
  },
  [OperationType.Glasses]: {
    path: '/assets/icons/drawing/O slide.svg'
  }
};

export const getSvgInfo = (operationType: string): { path: string; transform?: string } => {
  return operationSvgMapping[operationType] || { path: '' };
};