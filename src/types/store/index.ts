import { ApiType } from '@/api/types';
import rootReducer from '@/reducers';
import { getStore } from '@/store';

export type ExtraArgumentsStore = {
  api: ApiType;
};

const store = getStore();

export type RootState = ReturnType<ReturnType<typeof rootReducer>>;
export type Dispatch = typeof store.dispatch;

export type WrapArgsType<T> = {
  _args: T;
  stateId: string;
};

type PayloadOf<A> = A extends { payload: infer P } ? P : never;

export type UnwrapArgsType<A> = PayloadOf<A> extends WrapArgsType<infer Inner> ? { payload: Inner } : { payload: PayloadOf<A> };
