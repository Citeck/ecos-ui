import { all } from 'redux-saga/effects';
import app from './app';
import header from './header';
import slideMenu from './slideMenu';
import user from './user';

export default function* rootSaga(extraArguments) {
  yield all([app(extraArguments), header(extraArguments), slideMenu(extraArguments), user(extraArguments)]);
}
