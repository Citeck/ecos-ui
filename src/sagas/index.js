import { all } from 'redux-saga/effects';
import app from './app';
import header from './header';
import user from './user';

export default function* rootSaga(extraArguments) {
  yield all([app(extraArguments), header(extraArguments), user(extraArguments)]);
}
