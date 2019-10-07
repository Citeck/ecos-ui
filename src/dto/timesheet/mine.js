import get from 'lodash/get';

export default class MyTimesheetConverter {
  static getStatusForWeb(source = []) {
    const st = get(source, 'records[0]', {});
    const target = {};

    target.key = st.status;
    target.comment = '';

    return target;
  }
}
