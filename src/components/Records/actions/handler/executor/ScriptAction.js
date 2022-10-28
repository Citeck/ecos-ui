import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isUndefined from 'lodash/isUndefined';

import { t } from '../../../../../helpers/export/util';
import { notifyFailure } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

export default class ScriptAction extends ActionsExecutor {
  static ACTION_ID = 'script';

  async execForRecord(record, action, context) {
    const config = get(action, 'config', {});

    if (config.fn) {
      try {
        // eslint-disable-next-line no-eval
        const result = await eval(`
          (function(record, action, context) { ${config.fn} })();
        `)(record, action, context);

        if (isBoolean(result)) {
          return Boolean(result);
        }

        if (isUndefined(result)) {
          return true;
        }

        return result;
      } catch (e) {
        console.error('ScriptAction. Error when javascript evaluated', record, e);

        return false;
      }
    }

    if (config.module) {
      return new Promise(resolve => {
        window.require(
          [config.module],
          module => {
            const result = module.default.execute({ record, action, context });

            if (result) {
              if (result.then) {
                result
                  .then(res => resolve(res))
                  .catch(e => {
                    console.error(e);
                    notifyFailure(t('record-action.msg.error.text.error-found'));
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
      notifyFailure(t('record-action.script-action.error.text'));
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
