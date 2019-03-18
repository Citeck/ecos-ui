import { all } from 'redux-saga/effects';
import journals from '../../../../src/sagas/journals';

export default function* rootSaga(extraArguments) {
  yield all([journals(extraArguments)]);
}
