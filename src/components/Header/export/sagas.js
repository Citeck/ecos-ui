import { all } from 'redux-saga/effects';

import app from '../../../sagas/app';
import header from '../../../sagas/header';
import menu from '../../../sagas/menu';
import user from '../../../sagas/user';
import view from '../../../sagas/view';

export default function* rootSaga(extraArguments) {
  yield all([app(extraArguments), header(extraArguments), menu(extraArguments), user(extraArguments), view(extraArguments)]);
}
