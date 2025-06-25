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
