import get from 'lodash/get';

export default class CommonTimesheetConverter {
  static getStatusForWeb(source = []) {
    const st = get(source, 'records[0]', {});
    const target = {};

    target.key = st.status;
    target.taskId = st.taskId;
    target.comment = ''; //todo ?

    return target;
  }
}
