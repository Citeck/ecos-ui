import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import React from 'react';
import { Alert } from 'reactstrap';

import { EcosFormBuilderUtils } from '../EcosForm';
import EcosFormBuilderModal from '../EcosForm/builder/EcosFormBuilderModal';
import Records from '../Records/Records';
import { ActionTypes } from '../Records/actions/constants';
import { PERMISSION_WRITE_ATTR } from '../Records/constants';
import { EcosModal, InfoText } from '../common';
import { Btn } from '../common/btns';
import { Field, Input, SelectJournal } from '../common/form';

import { RecordActionsApi } from '@/api/recordActions';
import { SourcesId, SystemJournals } from '@/constants';
import { forbiddenSymbols } from '@/constants/validation';
import { pagesStore } from '@/helpers/indexedDB';
import { goToJournalsPage } from '@/helpers/urls';
import { t } from '@/helpers/util';

import './PreSettingsModal.style.scss';

const actionApi = new RecordActionsApi();

const Labels = {
  ID: 'ecos-form.new-record-ref.id',
  TYPE: 'ecos-form.create-new-artefact.type',
  MODAL_TITLE: 'ecos-form.create-new-artefact',
  INFO_TEXT_JOURNAL: 'ecos-form.create-new-artefact-info-text.journal',
  INFO_TEXT_FORM: 'ecos-form.create-new-artefact-info-text.form',
  INFO_TEXT_BOARD: 'ecos-form.create-new-artefact-info-text.board',
  CANCEL: 'btn.cancel.label',
  SAVE: 'btn.save.label'
};

export const PRE_SETTINGS_TYPES = {
  JOURNAL: 'journal',
  FORM: 'form',
  BOARD: 'board'
};

class PreSettingsModal extends React.Component {
  type = PRE_SETTINGS_TYPES.JOURNAL;
  recordRef = '';

  constructor(props) {
    super(props);

    this.type = props.type;
    this.recordRef = props.recordRef;
    this.config = props.config;
    this.callback = props.callback;
    this.isFormType = this.type === PRE_SETTINGS_TYPES.FORM;
    this.isBoardType = this.type === PRE_SETTINGS_TYPES.BOARD;

    this.state = {
      isOpen: props.isOpen || false,
      isValid: false,
      rollbackAttributes: {},
      newRecordRef: '',
      newType: [],
      isLoading: false
    };
  }

  componentDidMount() {
    this.fetchWorkspaceSysIdPrefix();
    this.fetchRollbackAttributes();
    this.fetchTypes();
  }

  hide = () => this.setState({ isOpen: false });

  toggleLoading = () => this.setState(prevState => ({ isLoading: !prevState.isLoading }));

  toggleEcosModalLoading = loading => {
    const { toggleLoader } = this.props;

    isFunction(toggleLoader) && toggleLoader(loading);
  };

  checkValidity = () => {
    const { newRecordRef } = this.state;

    const value = newRecordRef || '';
    const present = forbiddenSymbols.filter(ch => value.includes(ch));
    const isValid = present.length === 0;

    this.setState({
      isValid,
      ...(!isValid &&
        Array.from(newRecordRef || '').some(symbol => forbiddenSymbols.includes(symbol)) && {
          message: t('pre-settings-modal.error.not-valid', {
            chars: present.map(c => `'${c}'`).join(', ')
          })
        })
    });
  };

  fetchTypes = () => {
    if (!this.recordRef) {
      return;
    }

    const ref = this.isFormType
      ? `${SourcesId.RESOLVED_FORM}@`
      : this.isBoardType
        ? `${SourcesId.RESOLVED_BOARD}@`
        : `${SourcesId.RESOLVED_JOURNAL}@`;
    const [, id] = this.recordRef.split('@');
    const resolvedRef = this.recordRef.startsWith(ref) ? this.recordRef : `${ref}${id}`;

    Records.get(resolvedRef)
      .load('typeRef?id', true)
      .then(typeRef => {
        if (typeRef) {
          this.handleChangeTypes(typeRef);
        }
      })
      .catch(err => console.error(err));
  };

  getRollbackAttributesByType = () => {
    if (this.isFormType) {
      return {
        id: 'id',
        definition: 'definition?json',
        typeRef: 'typeRef'
      };
    }

    return {
      id: 'id',
      typeRef: 'typeRef'
    };
  };

  fetchRollbackAttributes = () => {
    const rollbackAttributes = this.getRollbackAttributesByType();

    Records.get(this.recordRef)
      .load(rollbackAttributes)
      .then(rollbackAttributes => {
        this.setState({ rollbackAttributes });
      });
  };

  fetchWorkspaceSysIdPrefix = async () => {
    const workspaceId = Citeck.Navigator.getWorkspaceId() || '';
    let workspaceSystemId = '';
    if (workspaceId && workspaceId !== 'default' && workspaceId.indexOf('admin$') !== 0) {
      workspaceSystemId = await Records.get(SourcesId.WORKSPACE + '@' + workspaceId).load('systemId');
    }
    let workspaceSysIdPrefix = '';
    if (workspaceSystemId) {
      workspaceSysIdPrefix = workspaceSystemId + ':';
    }
    this.setState({ workspaceSysIdPrefix });
  };

  rollback = () => {
    const { rollbackAttributes } = this.state;

    if (!rollbackAttributes) {
      return;
    }

    const record = Records.get(this.recordRef);
    for (let [attName, attValue] of Object.entries(rollbackAttributes)) {
      record.att(attName, attValue);
    }

    record.att(PERMISSION_WRITE_ATTR, '');
  };

  handleChangeRecordRef = event => {
    this.setState({ newRecordRef: event.target.value }, this.checkValidity);
  };

  handleChangeTypes = newType => {
    this.setState({ newType }, this.checkValidity);
  };

  handleCancel = () => {
    const { onHide } = this.props;

    this.hide();

    isFunction(onHide) && onHide();
  };

  getNewRef = () => {
    const { newRecordRef, workspaceSysIdPrefix } = this.state;

    if (this.isFormType) {
      return `${SourcesId.FORM}@${workspaceSysIdPrefix}${newRecordRef}`;
    }

    if (this.isBoardType) {
      return `${SourcesId.BOARD}@${workspaceSysIdPrefix}${newRecordRef}`;
    }

    return `${SourcesId.JOURNAL}@${workspaceSysIdPrefix}${newRecordRef}`;
  };

  handleSave = () => {
    const { rollbackAttributes, newRecordRef } = this.state;
    const newRef = this.getNewRef();

    this.toggleLoading(true);

    Records.get(newRef)
      .load('_notExists?bool', true)
      .then(notExists => {
        this.toggleLoading(false);

        if (notExists !== true) {
          this.setState({ isValid: false, message: t('admin-section.error.existed-module') });
          return;
        }

        if (this.isFormType) {
          return this.handleChangeForm();
        }

        if (this.isBoardType) {
          return this.handleChangeBoard();
        }
      })
      .then(() => {
        return pagesStore.migrate(rollbackAttributes.id, newRecordRef);
      })
      .then(() => {
        if (!this.isFormType && !this.isBoardType) {
          this.handleChangeJournal();
        }
      });
  };

  changeAttributes = (attributes = {}) => {
    this.toggleLoading();
    const { onHide } = this.props;
    const { newRecordRef, newType, workspaceSysIdPrefix } = this.state;

    this.instanceRecordToSave = Records.get(this.recordRef);

    this.instanceRecordToSave.att('id', newRecordRef);

    Object.entries(attributes).forEach(([attName, attValue]) => {
      this.instanceRecordToSave.att(attName, attValue);
    });

    const attByType = {
      [PRE_SETTINGS_TYPES.FORM]: 'formRef?id',
      [PRE_SETTINGS_TYPES.JOURNAL]: 'journalRef?id',
      [PRE_SETTINGS_TYPES.BOARD]: null
    };
    const att = attByType[this.type] || 'journalRef?id';
    const newRef = this.getNewRef();

    if (newType && att) {
      this.typeToSave = {
        typeRef: newType.replace(SourcesId.TYPE, 'emodel/types-repo'),
        newRef: newRef,
        attribute: att
      };
    } else {
      this.typeToSave = null;
    }

    this.toggleLoading();
    this.handleCancel();
    isFunction(this.callback) && this.callback(newRef);
    isFunction(onHide) && onHide();
  };

  handleChangeForm = () =>
    new Promise(resolve => {
      const { newRecordRef, newType, workspaceSysIdPrefix } = this.state;
      const { definition } = this.config;

      const builderDefinition = {
        ...definition,
        formId: newRecordRef
      };

      const onSubmit = newDefinition => {
        this.toggleEcosModalLoading(true);
        const attributes = {
          'definition?json': newDefinition,
          'typeRef?id': newType
        };

        const cb = this.callback;
        this.callback = newRef => {
          if (this.instanceRecordToSave) {
            this.instanceRecordToSave.save().then(() => {
              if (this.isFormType) {
                this.recordRef = `uiserv/form@${workspaceSysIdPrefix}${newRecordRef}`;
              }
              this.handleTypeToSave(this.typeToSave)
                .then(() => {
                  isFunction(cb) && cb(newRef, newDefinition);
                  isFunction(resolve) && resolve();
                })
                .catch(e => {
                  console.error('Type updating failed', this.typeToSave, e);
                  this.rollback();
                });
            });
          }
        };

        this.changeAttributes(attributes);
      };

      this.handleCancel();
      EcosFormBuilderUtils.__showEditorComponent('formBuilder', EcosFormBuilderModal, builderDefinition, onSubmit);
    });

  handleChangeJournal = () => {
    const { newRecordRef, newType, workspaceSysIdPrefix } = this.state;

    const cb = this.callback;

    const attributes = {
      typeRef: newType,
      [PERMISSION_WRITE_ATTR]: true
    };

    this.callback = newRef => {
      actionApi.executeAction({
        records: this.recordRef,
        action: {
          type: ActionTypes.EDIT,
          config: {
            saveOnSubmit: false,
            onFormCancel: this.rollback,
            onPreSettingSubmit: (record, form) => {
              const data = get(form, 'submission.data');

              if (this.instanceRecordToSave) {
                for (const [newAtt, attValue] of Object.entries(data)) {
                  if (newAtt === 'id' && attValue && attValue.includes('type$')) {
                    this.instanceRecordToSave.att(newAtt, attValue.replace('type$', ''));
                  } else {
                    this.instanceRecordToSave.att(newAtt, attValue);
                  }
                }

                this.instanceRecordToSave.save().then(() => {
                  this.handleTypeToSave(this.typeToSave)
                    .then(() => {
                      if (!this.isFormType) {
                        goToJournalsPage({ journalId: workspaceSysIdPrefix + newRecordRef, replaceJournal: true });
                      }
                    })
                    .catch(e => {
                      console.error('Type updating failed', this.typeToSave, e);
                      this.rollback();
                    });
                });
              }
            }
          }
        }
      });

      isFunction(cb) && cb(newRef);
    };

    this.changeAttributes(attributes);
  };

  handleChangeBoard = () => {
    const { newType } = this.state;

    const cb = this.callback;

    const attributes = {
      typeRef: newType,
      [PERMISSION_WRITE_ATTR]: true
    };

    this.callback = newRef => {
      actionApi.executeAction({
        records: this.recordRef,
        action: {
          type: ActionTypes.EDIT,
          config: {
            saveOnSubmit: false,
            onFormCancel: this.rollback,
            onPreSettingSubmit: (record, form) => {
              const data = get(form, 'submission.data');

              if (this.instanceRecordToSave) {
                for (const [newAtt, attValue] of Object.entries(data)) {
                  this.instanceRecordToSave.att(newAtt, attValue);
                }

                this.instanceRecordToSave
                  .save()
                  .then(() => {
                    isFunction(cb) && cb(newRef);
                  })
                  .catch(e => {
                    console.error('Board saving failed', e);
                    this.rollback();
                  });
              }
            }
          }
        }
      });

      isFunction(cb) && cb(newRef);
    };

    this.changeAttributes(attributes);
  };

  async handleTypeToSave(typeToSave) {
    if (!typeToSave) {
      return Promise.resolve(false);
    }
    const newTypeRecord = Records.getRecordToEdit(typeToSave.typeRef);
    const typeAtts = await newTypeRecord.load(
      {
        canWrite: PERMISSION_WRITE_ATTR,
        currentRef: typeToSave.attribute
      },
      true
    );
    if (typeAtts.canWrite === true && typeToSave.newRef !== typeAtts.currentRef) {
      newTypeRecord.att(typeToSave.attribute, typeToSave.newRef);
      return newTypeRecord.save().then(() => true);
    }
    return Promise.resolve(false);
  }

  render() {
    const { isOpen, isValid, message, isLoading, newRecordRef, newType } = this.state;

    return (
      <EcosModal title={t(Labels.MODAL_TITLE)} size="small" isOpen={isOpen} isLoading={isLoading} hideModal={this.handleCancel}>
        <div className="ecos-form-pre-settings">
          <Alert color="info">
            {t(this.isBoardType ? Labels.INFO_TEXT_BOARD : this.isFormType ? Labels.INFO_TEXT_FORM : Labels.INFO_TEXT_JOURNAL)}
          </Alert>
          <Field label={t(Labels.ID)} labelPosition="top" isRequired>
            <Input value={newRecordRef} onChange={this.handleChangeRecordRef} type="text" autoFocus />
            {!isValid && message && <InfoText className="ecos-form-pre-settings__validate-message" text={message} type="error" />}
          </Field>
          <Field label={t(Labels.TYPE)} isSmall={this.isSmall}>
            <SelectJournal
              journalId={SystemJournals.TYPES}
              defaultValue={newType}
              hideCreateButton
              isSelectedValueAsText
              onChange={this.handleChangeTypes}
            />
          </Field>
          <div className="ecos-form-pre-settings__buttons">
            <Btn className="ecos-btn_hover_light-blue" onClick={this.handleCancel}>
              {t(Labels.CANCEL)}
            </Btn>
            <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleSave} disabled={!isValid}>
              {t(Labels.SAVE)}
            </Btn>
          </div>
        </div>
      </EcosModal>
    );
  }
}

export default PreSettingsModal;
