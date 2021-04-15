import { all } from 'redux-saga/effects';

import app from '../../../sagas/app';
import header from '../../../sagas/header';
import iconSelect from '../../../sagas/iconSelect';
import menu from '../../../sagas/menu';
import menuSettings from '../../../sagas/menuSettings';
import view from '../../../sagas/view';
import user from '../../../sagas/user';

export default function* rootSaga(extraArguments) {
  yield all([
    app(extraArguments),
    header(extraArguments),
    iconSelect(extraArguments),
    menu(extraArguments),
    menuSettings(extraArguments),
    view(extraArguments),
    user(extraArguments)
  ]);
}
