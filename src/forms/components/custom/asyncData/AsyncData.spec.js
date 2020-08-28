import cloneDeep from 'lodash/cloneDeep';

import AsyncDataComponent from './AsyncData';
import Records from '../../../../components/Records';
import ecosFetch from '../../../../helpers/ecosFetch';

import Harness from '../../../test/harness';
import ajax1 from './fixtures/ajax1';
import ajax2 from './fixtures/ajax2';
import custom1 from './fixtures/custom1';
import custom2 from './fixtures/custom2';
import comp1 from './fixtures/comp1';
import record from './fixtures/record';
import recordsArray from './fixtures/recordsArray';
import recordsQuery from './fixtures/recordsQuery';
import recordsScript1 from './fixtures/recordsScript1';
import recordsScript2 from './fixtures/recordsScript2';

jest.mock('../../../../helpers/ecosFetch');

describe('AsyncData Component', () => {
  it('Should build an AsyncData component', done => {
    Harness.testCreate(AsyncDataComponent, {
      ...comp1,
      source: {
        type: 'custom',
        custom: {
          syncData: {},
          asyncData: {}
        }
      }
    }).then(() => {
      done();
    });
  });

  it('with "record" source', done => {
    const comp = cloneDeep(comp1);
    comp.source = cloneDeep(record.source);

    Harness.testCreate(AsyncDataComponent, comp, { recordId: record.record.id }).then(asyncData => {
      const spy = jest.spyOn(asyncData, '_loadAtts').mockResolvedValue(record.record);

      asyncData.on('componentChange', () => {
        expect(spy.mock.calls.length).toBe(1);
        expect(spy.mock.calls[0][0]).toBe(record.record.id);
        expect(spy.mock.calls[0][1]).toEqual(record.source.record.attributes);
        expect(asyncData.getValue()).toEqual(record.record);
        done();
      });
    });
  });

  it('with "recordsArray" source', done => {
    const comp = cloneDeep(comp1);
    comp.source = cloneDeep(recordsArray.source);

    Harness.testCreate(AsyncDataComponent, comp, { recordId: recordsArray.record1.id }).then(asyncData => {
      const spy = jest
        .spyOn(asyncData, '_loadAtts')
        .mockImplementation(id => Promise.resolve(id === recordsArray.record1.id ? recordsArray.record1 : recordsArray.record2));

      asyncData.on('componentChange', () => {
        expect(spy.mock.calls.length).toBe(2);
        expect(spy.mock.calls[0][0]).toBe(recordsArray.record1.id);
        expect(spy.mock.calls[0][1]).toEqual(recordsArray.source.recordsArray.attributes);
        expect(spy.mock.calls[1][0]).toBe(recordsArray.record2.id);
        expect(spy.mock.calls[1][1]).toEqual(recordsArray.source.recordsArray.attributes);
        expect(asyncData.getValue()).toEqual([recordsArray.record1, recordsArray.record2]);
        done();
      });
    });
  });

  it('with "recordsQuery" source', done => {
    const comp = cloneDeep(comp1);
    comp.source = cloneDeep(recordsQuery.source);

    let compPromiseResolve = null;
    const compPromise = new Promise(resolve => {
      compPromiseResolve = resolve;
    });
    Harness.testCreate(AsyncDataComponent, comp, { recordId: recordsQuery.record1.id }).then(asyncData => {
      const spy = jest.spyOn(Records, 'query').mockResolvedValue();

      asyncData.on('componentChange', () => {
        expect(spy.mock.calls.length).toBe(1);
        expect(spy.mock.calls[0][0]).toEqual(recordsQuery.queryObj);
        expect(spy.mock.calls[0][1]).toEqual(recordsQuery.source.recordsQuery.attributes);
        compPromiseResolve();
      });
    });

    const comp2 = cloneDeep(comp);
    comp2.source.recordsQuery.isSingle = true;

    let comp2PromiseResolve = null;
    const comp2Promise = new Promise(resolve => {
      comp2PromiseResolve = resolve;
    });
    Harness.testCreate(AsyncDataComponent, comp2, { recordId: recordsQuery.record1.id }).then(asyncData => {
      const spy = jest.spyOn(Records, 'queryOne').mockResolvedValue();

      asyncData.on('componentChange', () => {
        expect(spy.mock.calls.length).toBe(1);
        expect(spy.mock.calls[0][0]).toEqual(recordsQuery.queryObj);
        expect(spy.mock.calls[0][1]).toEqual(recordsQuery.source.recordsQuery.attributes);
        comp2PromiseResolve();
      });
    });

    Promise.all([compPromise, comp2Promise]).then(() => {
      done();
    });
  });

  it('with "ajax" source (GET)', done => {
    const comp = cloneDeep(comp1);
    comp.source = cloneDeep(ajax1.source);

    Harness.testCreate(AsyncDataComponent, comp).then(asyncData => {
      ecosFetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(ajax1.response))));
      expect(ecosFetch).toHaveBeenCalledTimes(0);
      asyncData.on('componentChange', () => {
        expect(ecosFetch).toHaveBeenCalledTimes(1);
        expect(ecosFetch.mock.calls[0][0]).toBe(ajax1.fetchUrl);
        expect(ecosFetch.mock.calls[0][1]['method']).toEqual(ajax1.source.ajax.method);
        expect(asyncData.getValue()).toEqual(ajax1.mapping);
        done();
      });
    });
  });

  it('with "ajax" source (POST)', done => {
    const comp = cloneDeep(comp1);
    comp.source = cloneDeep(ajax2.source);

    Harness.testCreate(AsyncDataComponent, comp).then(asyncData => {
      ecosFetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(ajax2.response))));
      expect(ecosFetch).toHaveBeenCalledTimes(1);
      asyncData.on('componentChange', () => {
        expect(ecosFetch).toHaveBeenCalledTimes(2);
        expect(ecosFetch.mock.calls[1][0]).toBe(ajax2.fetchUrl);
        expect(ecosFetch.mock.calls[1][1]['method']).toEqual(comp.source.ajax.method);
        expect(ecosFetch.mock.calls[1][1]['body']).toEqual(JSON.stringify(comp.source.ajax.data));
        expect(asyncData.getValue()).toEqual(ajax2.response);
        done();
      });
    });
  });

  it('with "custom" source', done => {
    const comp = cloneDeep(comp1);
    comp.source = cloneDeep(custom1.source);

    Harness.testCreate(AsyncDataComponent, comp).then(asyncData => {
      asyncData.on('componentChange', () => {
        expect(asyncData.getValue()).toBe(custom1.result);
        done();
      });
    });
  });

  it('with "custom" source: return Promise', done => {
    const comp = cloneDeep(comp1);
    comp.source = cloneDeep(custom2.source);

    Harness.testCreate(AsyncDataComponent, comp).then(asyncData => {
      asyncData.on('componentChange', () => {
        expect(asyncData.getValue()).toBe(custom2.result);
        done();
      });
    });
  });

  it('with "recordsScript" source (single record)', done => {
    const comp = cloneDeep(comp1);
    comp.source = cloneDeep(recordsScript1.source);

    Harness.testCreate(AsyncDataComponent, comp, { recordId: recordsScript1.record1.id }).then(asyncData => {
      const spy = jest.spyOn(asyncData, '_loadAtts').mockResolvedValue(recordsScript1.record1);

      asyncData.on('componentChange', () => {
        expect(spy.mock.calls.length).toBe(1);
        expect(spy.mock.calls[0][0]).toBe(recordsScript1.record1.id);
        expect(spy.mock.calls[0][1]).toEqual(recordsScript1.source.recordsScript.attributes);
        expect(asyncData.getValue()).toEqual(recordsScript1.record1);
        done();
      });
    });
  });

  it('with "recordsScript" source (multiple records)', done => {
    const comp = cloneDeep(comp1);
    comp.source = cloneDeep(recordsScript2.source);

    Harness.testCreate(AsyncDataComponent, comp, { recordId: recordsScript2.record1.id }).then(asyncData => {
      const spy = jest
        .spyOn(asyncData, '_loadAtts')
        .mockImplementation(id => Promise.resolve(id === recordsScript2.record1.id ? recordsScript2.record1 : recordsScript2.record2));

      asyncData.on('componentChange', () => {
        expect(spy.mock.calls.length).toBe(2);
        expect(spy.mock.calls[0][0]).toBe(recordsScript2.record1.id);
        expect(spy.mock.calls[0][1]).toEqual(recordsScript2.source.recordsScript.attributes);
        expect(spy.mock.calls[1][0]).toBe(recordsScript2.record2.id);
        expect(spy.mock.calls[1][1]).toEqual(recordsScript2.source.recordsScript.attributes);
        expect(asyncData.getValue()).toEqual([recordsScript2.record1, recordsScript2.record2]);
        done();
      });
    });
  });
});
