import { all } from 'redux-saga/effects';
import app from '../../../../src/sagas/app';
import journals from '../../../../src/sagas/journals';

export default function* rootSaga(extraArguments) {
  yield all([app(extraArguments), journals(extraArguments)]);
}
