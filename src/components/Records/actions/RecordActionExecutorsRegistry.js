import { t } from '../../../helpers/util';

let Registry;

class RecordActionExecutorsRegistry {
  registry = {};

  get(type) {
    return this.registry[type];
  }

  addExecutor(key, executor) {
    this.registry[key] = executor;
  }

  addExecutors(executors) {
    for (let key in executors) {
      if (executors.hasOwnProperty(key)) {
        this.addExecutor(key, executors[key]);
      }
    }
  }

  getSupportedTypes() {
    return Object.keys(this.registry);
  }

  getActionCreateVariants() {
    let types = this.getSupportedTypes()
      //filter legacy case actions
      .filter(type => type[0] !== type[0].toUpperCase());

    types.push('record-actions');

    return types.map(type => {
      const formKey = 'action_' + type;
      return {
        recordRef: formKey,
        formKey: formKey,
        attributes: {
          type
        },
        label: t('action.' + type + '.label')
      };
    });
  }
}

window.Citeck = window.Citeck || {};
Registry = window.Citeck.RecordActionExecutorsRegistry || new RecordActionExecutorsRegistry();
window.Citeck.RecordActionExecutorsRegistry = Registry;

export default Registry;
