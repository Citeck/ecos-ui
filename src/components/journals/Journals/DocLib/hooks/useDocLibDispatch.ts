import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { wrapArgs } from '@/helpers/redux';

type ActionCreator = (payload?: unknown) => { type: string; payload?: unknown };

/**
 * Dispatch docLib actions with the payload wrapped by stateId (see wrapArgs/wrapSaga).
 */
export function useDocLibDispatch(stateId: string) {
  const dispatch = useDispatch();

  return useCallback(
    (actionCreator: ActionCreator, payload?: unknown) => {
      const w = wrapArgs(stateId);
      return dispatch(actionCreator(w(payload)));
    },
    [dispatch, stateId]
  );
}

export type DocLibDispatch = ReturnType<typeof useDocLibDispatch>;
