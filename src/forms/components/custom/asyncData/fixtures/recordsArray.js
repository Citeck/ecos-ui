import record1 from './record1';
import record2 from './record2';

export default {
  source: {
    type: 'recordsArray',
    recordsArray: {
      id: `{{ recordId }},${record2.id}`,
      attributes: {
        testFieldStr: 'testField?disp',
        testFieldNum: 'testField?num'
      }
    }
  },
  record1,
  record2
};
