import { all } from 'redux-saga/effects';
import journals from '../../../../sagas/journals';

export default function* rootSaga(extraArguments) {
  yield all([journals(extraArguments)]);
}
