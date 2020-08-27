import cloneDeep from 'lodash/cloneDeep';

import Harness from '../../../test/harness';
import AsyncDataComponent from './AsyncData';
import Records from '../../../../components/Records';

import comp1 from './fixtures/comp1';
import record1 from './fixtures/record1';
import record2 from './fixtures/record2';

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
    comp.source = {
      type: 'record',
      record: {
        id: '{{ recordId }}',
        attributes: {
          testFieldStr: 'testField?disp',
          testFieldNum: 'testField?num'
        }
      }
    };

    Harness.testCreate(AsyncDataComponent, comp, { recordId: record1.id }).then(asyncData => {
      const spy = jest.spyOn(asyncData, '_loadAtts').mockResolvedValue(record1);
      asyncData.on('componentChange', () => {
        expect(spy.mock.calls.length).toBe(1);
        expect(spy.mock.calls[0][0]).toBe(record1.id);
        expect(spy.mock.calls[0][1]).toEqual(comp.source.record.attributes);
        expect(asyncData.getValue()).toEqual(record1);
        done();
      });
    });
  });

  it('with "recordsArray" source', done => {
    const comp = cloneDeep(comp1);
    comp.source = {
      type: 'recordsArray',
      recordsArray: {
        id: `{{ recordId }},${record2.id}`,
        attributes: {
          testFieldStr: 'testField?disp',
          testFieldNum: 'testField?num'
        }
      }
    };

    Harness.testCreate(AsyncDataComponent, comp, { recordId: record1.id }).then(asyncData => {
      const spy = jest.spyOn(asyncData, '_loadAtts').mockImplementation(id => Promise.resolve(id === record1.id ? record1 : record2));
      asyncData.on('componentChange', () => {
        expect(spy.mock.calls.length).toBe(2);
        expect(spy.mock.calls[0][0]).toBe(record1.id);
        expect(spy.mock.calls[0][1]).toEqual(comp.source.recordsArray.attributes);
        expect(spy.mock.calls[1][0]).toBe(record2.id);
        expect(spy.mock.calls[1][1]).toEqual(comp.source.recordsArray.attributes);
        expect(asyncData.getValue()).toEqual([record1, record2]);
        done();
      });
    });
  });

  it('with "recordsQuery" source', done => {
    const queryObj = {
      query: 'some query',
      language: 'fake query language'
    };
    const comp = cloneDeep(comp1);
    comp.source = {
      type: 'recordsQuery',
      recordsQuery: {
        query: `value = ${JSON.stringify(queryObj)}`,
        attributes: {
          testFieldStr: 'testField?disp',
          testFieldNum: 'testField?num'
        },
        isSingle: false
      }
    };

    let compPromiseResolve = null;
    const compPromise = new Promise(resolve => {
      compPromiseResolve = resolve;
    });
    Harness.testCreate(AsyncDataComponent, comp, { recordId: record1.id }).then(asyncData => {
      const spy = jest.spyOn(Records, 'query').mockResolvedValue();
      asyncData.on('componentChange', () => {
        expect(spy.mock.calls.length).toBe(1);
        expect(spy.mock.calls[0][0]).toEqual(queryObj);
        expect(spy.mock.calls[0][1]).toEqual(comp.source.recordsQuery.attributes);
        compPromiseResolve();
      });
    });

    const comp2 = cloneDeep(comp);
    comp2.source.recordsQuery.isSingle = true;

    let comp2PromiseResolve = null;
    const comp2Promise = new Promise(resolve => {
      comp2PromiseResolve = resolve;
    });
    Harness.testCreate(AsyncDataComponent, comp2, { recordId: record1.id }).then(asyncData => {
      const spy = jest.spyOn(Records, 'queryOne').mockResolvedValue();
      asyncData.on('componentChange', () => {
        expect(spy.mock.calls.length).toBe(1);
        expect(spy.mock.calls[0][0]).toEqual(queryObj);
        expect(spy.mock.calls[0][1]).toEqual(comp2.source.recordsQuery.attributes);
        comp2PromiseResolve();
      });
    });

    Promise.all([compPromise, comp2Promise]).then(() => {
      done();
    });
  });

  // TODO Ajax

  it('with "custom" source', done => {
    const comp = cloneDeep(comp1);
    comp.source = {
      type: 'custom',
      custom: {
        syncData: `value = 5`,
        asyncData: `value = data * 2;`
      }
    };

    Harness.testCreate(AsyncDataComponent, comp).then(asyncData => {
      asyncData.on('componentChange', () => {
        expect(asyncData.getValue()).toBe(10);
        done();
      });
    });
  });

  it('with "custom" source: return Promise', done => {
    const comp = cloneDeep(comp1);
    comp.source = {
      type: 'custom',
      custom: {
        syncData: `value = 5`,
        asyncData: `value = Promise.resolve(data * 2);`
      }
    };

    Harness.testCreate(AsyncDataComponent, comp).then(asyncData => {
      asyncData.on('componentChange', () => {
        expect(asyncData.getValue()).toBe(10);
        done();
      });
    });
  });

  it('with "recordsScript" source (single record)', done => {
    const comp = cloneDeep(comp1);
    comp.source = {
      type: 'recordsScript',
      recordsScript: {
        script: 'value = recordId;',
        attributes: {
          testFieldStr: 'testField?disp',
          testFieldNum: 'testField?num'
        }
      }
    };

    Harness.testCreate(AsyncDataComponent, comp, { recordId: record1.id }).then(asyncData => {
      const spy = jest.spyOn(asyncData, '_loadAtts').mockResolvedValue(record1);
      asyncData.on('componentChange', () => {
        expect(spy.mock.calls.length).toBe(1);
        expect(spy.mock.calls[0][0]).toBe(record1.id);
        expect(spy.mock.calls[0][1]).toEqual(comp.source.recordsScript.attributes);
        expect(asyncData.getValue()).toEqual(record1);
        done();
      });
    });
  });

  it('with "recordsScript" source (multiple records)', done => {
    const comp = cloneDeep(comp1);
    comp.source = {
      type: 'recordsScript',
      recordsScript: {
        script: `value = [recordId, '${record2.id}'];`,
        attributes: {
          testFieldStr: 'testField?disp',
          testFieldNum: 'testField?num'
        }
      }
    };

    Harness.testCreate(AsyncDataComponent, comp, { recordId: record1.id }).then(asyncData => {
      const spy = jest.spyOn(asyncData, '_loadAtts').mockImplementation(id => Promise.resolve(id === record1.id ? record1 : record2));
      asyncData.on('componentChange', () => {
        expect(spy.mock.calls.length).toBe(2);
        expect(spy.mock.calls[0][0]).toBe(record1.id);
        expect(spy.mock.calls[0][1]).toEqual(comp.source.recordsScript.attributes);
        expect(spy.mock.calls[1][0]).toBe(record2.id);
        expect(spy.mock.calls[1][1]).toEqual(comp.source.recordsScript.attributes);
        expect(asyncData.getValue()).toEqual([record1, record2]);
        done();
      });
    });
  });
});
