import ActionsExecutor from '../../ActionsExecutor';
import Records from '../../../../Records';
import DialogManager from '../../../../../common/dialogs/Manager';
import lodashGet from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import EcosFormUtils from '../../../../../EcosForm/EcosFormUtils';
import { getCurrentLocale, t } from '../../../../../../helpers/export/util';
import dialogManager from '../../../../../common/dialogs/Manager/DialogManager';

export default class TaskOutcomeAction extends ActionsExecutor {
  static ACTION_ID = 'task-outcome';

  async execForRecord(record, action, context) {
    const {
      config: { label, outcome, formRef, taskRef }
    } = action;

    if (!outcome || !formRef || !taskRef) {
      console.error('Incorrect action', action);
      DialogManager.showInfoDialog({
        title: 'record-action.task-outcome.incorrect-action.header',
        text: 'record-action.task-outcome.incorrect-action.message'
      });
      return false;
    }

    const formDefRes = await Records.query(
      {
        sourceId: 'uiserv/task-form',
        language: 'form',
        query: { formRef }
      },
      '.json'
    );

    const formDef = lodashGet(formDefRes, 'records[0][".json"]');

    if (!formDef || !formDef.definition) {
      console.error('Form is not defined', formDefRes);
      DialogManager.showInfoDialog({
        title: 'record-action.task-outcome.form-not-found.header',
        text: 'record-action.task-outcome.form-not-found.message'
      });
      return false;
    }

    let formInputs = EcosFormUtils.getFormInputs(formDef.definition);
    let formI18n = await this.getFormI18n(taskRef, formInputs, formDef.i18n);
    formI18n = { [getCurrentLocale()]: formI18n };

    return new Promise(resolve => {
      const completeAction = attributes => {
        let task = Records.getRecordToEdit(taskRef);
        task.att('outcome_' + outcome, true);

        if (attributes && Object.keys(attributes).length) {
          const keysMapping = EcosFormUtils.getKeysMapping(formInputs);
          const inputByKey = EcosFormUtils.getInputByKey(formInputs);

          for (let att in attributes) {
            if (attributes.hasOwnProperty(att)) {
              let input = inputByKey[att];
              const excludeComponents = ['horizontalLine', 'asyncData', 'taskOutcome'];
              if (input && input.component && excludeComponents.includes(input.component.type)) {
                continue;
              }
              let value = EcosFormUtils.processValueBeforeSubmit(attributes[att], input, keysMapping);

              task.att(att, value);
            }
          }
        }

        task
          .save()
          .then(() => {
            resolve(true);
          })
          .catch(e => {
            console.error(e);
            dialogManager.showInfoDialog({
              title: 'record-action.delete.dialog.title.error',
              text: e.message || 'record-action.delete.dialog.msg.error',
              onClose: () => resolve(false)
            });
            resolve(false);
          });
      };

      let messageWithOutcome = t('record-action.task-outcome.complete-task.message', { outcome: label });

      if (!formInputs.length) {
        DialogManager.confirmDialog({
          title: 'record-action.task-outcome.complete-task.header',
          text: messageWithOutcome + '?',
          onNo: () => resolve(false),
          onYes: () => completeAction({})
        });
      } else {
        DialogManager.showFormDialog({
          title: messageWithOutcome,
          showDefaultButtons: true,
          formDefinition: formDef.definition,
          formOptions: {
            recordId: taskRef
          },
          formI18n,
          onCancel: () => resolve(false),
          onSubmit: async submission => completeAction(submission.data)
        });
      }
    });
  }

  async getFormI18n(taskRef, inputs, formDefI18n) {
    if (!formDefI18n) {
      formDefI18n = {};
    } else {
      let locale = getCurrentLocale();
      if (formDefI18n[locale]) {
        formDefI18n = formDefI18n[locale];
      } else {
        let locales = Object.keys(formDefI18n);
        if (locales.length) {
          formDefI18n = formDefI18n[locales[0]];
        } else {
          formDefI18n = {};
        }
      }
    }

    if (!inputs.length) {
      return formDefI18n;
    }

    let attsToReq = {};
    for (let input of inputs) {
      let label = input.component['label'];
      if (label === input.attribute) {
        attsToReq[label] = '.edge(n:"' + input.attribute + '"){title}';
      }
    }

    if (attsToReq && !Object.keys(attsToReq).length) {
      return formDefI18n;
    }

    let attsI18n = await Records.get(taskRef).load(attsToReq);
    if (!attsI18n) {
      return formDefI18n;
    }

    let result = cloneDeep(attsI18n);
    for (let key in formDefI18n) {
      if (formDefI18n.hasOwnProperty(key)) {
        result[key] = formDefI18n[key];
      }
    }
    return result;
  }

  getDefaultActionModel() {
    return {
      name: 'module.copy'
    };
  }
}
