import { all } from 'redux-saga/effects';
import header from './header';
import user from './user';

export default function* rootSaga(extraArguments) {
  yield all([header(extraArguments), user(extraArguments)]);
}
