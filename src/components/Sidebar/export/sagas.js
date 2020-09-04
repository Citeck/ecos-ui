import { all } from 'redux-saga/effects';

import app from '../../../sagas/app';
import menu from '../../../sagas/menu';
import slideMenu from '../../../sagas/slideMenu';
import view from '../../../sagas/view';

export default function* rootSaga(extraArguments) {
  yield all([app(extraArguments), menu(extraArguments), slideMenu(extraArguments), view(extraArguments)]);
}
