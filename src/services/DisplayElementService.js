import { getBool, isExistValue } from '../helpers/util';

export default class DisplayElementService {
  static placeholderCondition = '[{ "t": "eq", "att": "title", "val": "№333" }, ...]';

  static isValidCondition(condition) {
    try {
      const jsonCondition = !condition || JSON.parse(condition);

      return !condition || Array.isArray(jsonCondition) || typeof jsonCondition === 'object';
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  static checkResultCondition(result) {
    return isExistValue(result) ? getBool(result) : true;
  }
}
