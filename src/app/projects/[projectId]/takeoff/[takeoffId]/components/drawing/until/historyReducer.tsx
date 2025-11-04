import { useReducer, useCallback, useRef, useEffect } from 'react';

// 历史记录状态接口
interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

// 历史记录操作类型
type HistoryAction<T> =
    | { type: 'UNDO' }
    | { type: 'REDO' }
    | { type: 'SET'; newState: T }
    | { type: 'PUSH'; newPresent: T }
    | { type: 'CLEAR' };

function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  const { past, present, future } = state;
  switch (action.type) {
    case 'UNDO': {
      if (past.length === 0) return state;

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [present, ...future]
      };
    }

    case 'REDO': {
      if (future.length === 0) return state;

      const next = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, present],
        present: next,
        future: newFuture
      };
    }

    case 'SET': {
      return {
        past: [],
        present: action.newState,
        future: []
      };
    }

    case 'PUSH': {
      if (JSON.stringify(present) === JSON.stringify(action.newPresent)) {
        return state;
      }

      return {
        past: present.length != 0 ? JSON.parse(JSON.stringify([...past, present])) : JSON.parse(JSON.stringify([...past])),
        present: JSON.parse(JSON.stringify(action.newPresent)),
        future: []
      };
    }

    case 'CLEAR': {
      return {
        past: [],
        present: [],
        future: []
      };
    }

    default:
      return state;
  }
}

export function useHistory<T>(initialState: T, onStateChange?: (newState: T) => void) {
  const [state, dispatch] = useReducer(historyReducer<T>, {
    past: [],
    present: initialState,
    future: []
  });

  const stateRef = useRef<any>(null);

  useEffect(() => {
    // if(state.present.elements && state.present.zones) onStateChange?.(state.present)
    stateRef.current = state.present
    onStateChange?.(state.present)
  }, [state.future.length]);

  //
  // const prevStateRef = useRef(state.present);
  //
  // useEffect(() => {
  //   if (onStateChange && prevStateRef.current !== state.present) {
  //     onStateChange(state.present);
  //     prevStateRef.current = state.present;
  //   }
  // }, [state.present, onStateChange]);

  const canUndo = true;
  const canRedo = true;
  // const undo = useCallback(() => {
  //   if (canUndo) {
  //     dispatch({ type: 'UNDO' });
  //     console.log(state.present, 'presentpresentpresentpresentpresent')
  //     setTimeout(() => {
  //       onStateChange?.(state.present)
  //     }, 100)
  //   }
  // }, [canUndo]);

  const undo = () => {
      if (canUndo) {
        dispatch({ type: 'UNDO' })
        console.log(state, 'aaaaaaaaaaaaaaaaaaa')
        // if(stateRef.current){
        //   onStateChange?.(state.present)
        // }
        // onStateChange?.(state.present)
        // if (state.past.length === 0) onStateChange?.(state.present)
        // else {
        //   const previous = state.past[state.past.length - 1];
        //   onStateChange?.(previous)
        // }
      }
  }

  const redo = () => {
    if (canRedo) {
      dispatch({ type: 'REDO' });
      // onStateChange?.(state.present)
      // if (state.future.length === 0) onStateChange?.(state.present)
      // else {
      //   const next = state.future[0];
      //   const newFuture = state.future.slice(1);
      // }
      // setTimeout(() => {
      //   onStateChange?.(state.present)
      // }, 200)
    }
  }

  // const redo = useCallback(() => {
  //   if (canRedo) {
  //     dispatch({ type: 'REDO' });
  //     console.log(state)
  //     setTimeout(() => {
  //       onStateChange?.(state.present)
  //     }, 100)
  //   }
  // }, [canRedo]);

  const set = useCallback((newState: T) => {
    dispatch({ type: 'SET', newState });
  }, []);

  const push = useCallback((newPresent: T) => {
    console.log('PUSHPUSH')
    dispatch({ type: 'PUSH', newPresent });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  return {
    state: state.present,
    undo,
    redo,
    set,
    push,
    clear,
    canUndo,
    canRedo
  };
}