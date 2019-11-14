import { all } from 'redux-saga/effects';

import slideMenu from '../sagas/slideMenu';
import view from '../../../sagas/view';

export default function* rootSaga(extraArguments) {
  yield all([slideMenu(extraArguments), view(extraArguments)]);
}
