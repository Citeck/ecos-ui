import { all } from 'redux-saga/effects';

import app from '../../../sagas/app';
import menu from '../../../sagas/menu';
import slideMenu from '../../../sagas/slideMenu';
import view from '../../../sagas/view';
import user from '../../../sagas/user';

export default function* rootSaga(extraArguments) {
  yield all([app(extraArguments), menu(extraArguments), slideMenu(extraArguments), view(extraArguments), user(extraArguments)]);
}
