import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import barcodeSaga from '../barcode';

import { getBarcodePrintPdf, getBase64Barcode } from '@/actions/barcode';

describe('barcode print action/saga', () => {
  it.each([false, true])('hands PDF/error to local callbacks, not reducer state (failure=%s)', async fail => {
    const blob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
    const error = Object.assign(new Error('fit'), { status: 400 });
    const getPrintPdf = jest.fn(() => (fail ? Promise.reject(error) : Promise.resolve(blob)));
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const actions = [];
    // Drive the real watcher to prove the action is registered.
    const middleware = createSagaMiddleware();
    const store = createStore((state = {}, action) => {
      actions.push(action);
      return state;
    }, applyMiddleware(middleware));
    const task = middleware.run(barcodeSaga, { api: { barcode: { getPrintPdf } } });
    const signal = new AbortController().signal;
    store.dispatch(getBarcodePrintPdf({ record: 'test@id', printSettings: { scalePercent: 150 }, signal, onSuccess, onError }));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(getPrintPdf).toHaveBeenCalledWith({ record: 'test@id', printSettings: { scalePercent: 150 }, signal });
    expect(fail ? onError : onSuccess).toHaveBeenCalledWith(fail ? error : blob);
    expect(fail ? onSuccess : onError).not.toHaveBeenCalled();
    expect(actions.filter(action => !action.type.startsWith('@@redux/')).map(action => action.type)).toEqual([getBarcodePrintPdf().type]);
    task.cancel();
  });

  it('keeps preview generation in its old independent raster profile', async () => {
    const middleware = createSagaMiddleware();
    const actions = [];
    const store = createStore((state = {}, action) => {
      actions.push(action);
      return state;
    }, applyMiddleware(middleware));
    const getBade64Barcode = jest.fn().mockResolvedValue({ data: 'png' });
    const task = middleware.run(barcodeSaga, { api: { barcode: { getBade64Barcode } } });
    store.dispatch(getBase64Barcode({ stateId: 'widget', record: 'test@id' }));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(getBade64Barcode).toHaveBeenCalledWith({ record: 'test@id', params: { height: 100, width: 210 } });
    expect(actions).toContainEqual(expect.objectContaining({ payload: { stateId: 'widget', barcode: 'data:image/png;base64,png' } }));
    task.cancel();
  });
});
