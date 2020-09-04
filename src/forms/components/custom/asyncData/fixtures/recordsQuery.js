import record1 from './record1';
import record2 from './record2';

const queryObj = {
  query: 'some query',
  language: 'fake query language'
};

export default {
  queryObj,
  source: {
    type: 'recordsQuery',
    recordsQuery: {
      query: `value = ${JSON.stringify(queryObj)}`,
      attributes: {
        testFieldStr: 'testField?disp',
        testFieldNum: 'testField?num'
      },
      isSingle: false
    }
  },
  record1,
  record2
};
