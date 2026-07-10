import { useSelector } from 'react-redux';

/**
 * The docLib selectors are plain JS and are parameterized by stateId
 * (selector(state, stateId)); their inferred reselect types accept only state.
 * This hook centralizes the cast and keeps call sites clean.
 */
export function useDocLibSelector<T>(selector: (state: never, stateId: string) => unknown, stateId: string): T {
  return useSelector(state => (selector as (state: unknown, stateId: string) => T)(state, stateId));
}
