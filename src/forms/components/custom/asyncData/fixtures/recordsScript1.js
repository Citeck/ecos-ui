import record1 from './record1';
import record2 from './record2';

export default {
  source: {
    type: 'recordsScript',
    recordsScript: {
      script: 'value = recordId;',
      attributes: {
        testFieldStr: 'testField?disp',
        testFieldNum: 'testField?num'
      }
    }
  },
  record1,
  record2
};
