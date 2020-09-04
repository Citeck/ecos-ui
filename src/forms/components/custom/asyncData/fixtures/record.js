import record1 from './record1';

export default {
  source: {
    type: 'record',
    record: {
      id: '{{ recordId }}',
      attributes: {
        testFieldStr: 'testField?disp',
        testFieldNum: 'testField?num'
      }
    }
  },
  record: record1
};
