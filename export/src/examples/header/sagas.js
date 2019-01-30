import { all } from 'redux-saga/effects';
import app from '../../../../src/sagas/app';
import header from '../../../../src/sagas/header';

export default function* rootSaga(extraArguments) {
  yield all([app(extraArguments), header(extraArguments)]);
}
