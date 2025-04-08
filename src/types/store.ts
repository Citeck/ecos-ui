import { ApiType } from '@/api/types';
import rootReducer from '@/reducers';

export type ExtraArgumentsStore = {
  api: ApiType;
};

export type RootState = ReturnType<ReturnType<typeof rootReducer>>;
