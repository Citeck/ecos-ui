import { all } from 'redux-saga/effects';
import user from './user';

export default function* rootSaga(extraArguments) {
  yield all([user(extraArguments)]);
}
