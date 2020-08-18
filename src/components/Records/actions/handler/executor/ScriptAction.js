import ActionsExecutor from '../ActionsExecutor';
import get from 'lodash/get';
import { notifyFailure } from '../../util/actionUtils';

export default class ScriptAction extends ActionsExecutor {
  static ACTION_ID = 'script';

  async execForRecord(record, action, context) {
    let config = get(context, 'action.config', {});

    if (config.module) {
      return new Promise(resolve => {
        window.require(
          [config.module],
          module => {
            const result = module.default.execute(context);

            if (result) {
              if (result.then) {
                result
                  .then(res => resolve(res))
                  .catch(e => {
                    console.error(e);
                    resolve(true);
                  });
              } else {
                resolve(result);
              }
            } else {
              resolve(true);
            }
          },
          error => {
            console.error(error);
            notifyFailure();
            resolve(false);
          }
        );
      });
    } else {
      console.error('Module is not specified!');
      notifyFailure('record-action.script-action.error.text');
      return false;
    }
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.script-action',
      icon: 'icon-small-check'
    };
  }
}
