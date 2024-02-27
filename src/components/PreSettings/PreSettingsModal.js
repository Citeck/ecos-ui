import React from 'react';
import { Alert } from 'reactstrap';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { EcosModal, InfoText } from '../common';
import { Btn } from '../common/btns';
import { t } from '../../helpers/util';
import { Field, Input, SelectJournal } from '../common/form';
import { SourcesId, SystemJournals } from '../../constants';
import { RecordActionsApi } from '../../api/recordActions';
import { goToJournalsPage } from '../../helpers/urls';
import { pagesStore } from '../../helpers/indexedDB';
import { EcosFormBuilderUtils } from '../EcosForm';
import EcosFormBuilderModal from '../EcosForm/builder/EcosFormBuilderModal';
import { PREDICATE_EQ } from '../Records/predicates/predicates';
import { ActionTypes } from '../Records/actions/constants';
import { PERMISSION_WRITE_ATTR } from '../Records/constants';
import Records from '../Records/Records';

import './PreSettingsModal.style.scss';

const actionApi = new RecordActionsApi();

const Labels = {
  ID: 'ecos-form.new-record-ref.id',
  TYPE: 'ecos-form.create-new-artefact.type',
  MODAL_TITLE: 'ecos-form.create-new-artefact',
  INFO_TEXT: 'ecos-form.create-new-artefact-info-text',
  CANCEL: 'btn.cancel.label',
  SAVE: 'btn.save.label'
};

export const PRE_SETTINGS_TYPES = {
  JOURNAL: 'journal',
  FORM: 'form'
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

    this.setState({
      isValid: !!newRecordRef
    });
  };

  fetchTypes = () => {
    if (!this.recordRef) {
      return;
    }

    Records.query(
      {
        sourceId: SourcesId.TYPE,
        language: 'predicate',
        query: {
          t: PREDICATE_EQ,
          a: this.isFormType ? 'formRef' : 'journalRef',
          v: this.recordRef
        }
      },
      {
        id: 'id'
      }
    ).then(result => {
      const [, id] = this.recordRef.split('@') || '';
      const [, typeName] = id.split('$');

      if (Array.isArray(result.records)) {
        this.handleChangeTypes(`${SourcesId.TYPE}@${get(result.records.find(record => record.id === typeName), 'id')}`);
      }
    });
  };

  fetchRollbackAttributes = () => {
    const rollbackAttributes = this.isFormType
      ? {
          id: 'id',
          definition: 'definition?json',
          typeRef: 'typeRef'
        }
      : {
          id: 'id',
          typeRef: 'typeRef'
        };

    Records.get(this.recordRef)
      .load(rollbackAttributes)
      .then(rollbackAttributes => {
        this.setState({ rollbackAttributes });
      });
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

  handleSave = () => {
    const { newRecordRef, rollbackAttributes } = this.state;
    const newRef = this.type === PRE_SETTINGS_TYPES.FORM ? `${SourcesId.FORM}@${newRecordRef}` : `${SourcesId.JOURNAL}@${newRecordRef}`;

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

      })
      .then(() => {
        return pagesStore.migrate(rollbackAttributes.id, newRecordRef);
      })
      .then(() => {
        this.handleChangeJournal();
      });
  };

  changeAttributes = (attributes = {}) => {
    this.toggleLoading();
    const { onHide } = this.props;
    const { newRecordRef, newType } = this.state;

    this.instanceRecordToSave = Records.get(this.recordRef);

    this.instanceRecordToSave.att('id', newRecordRef);

    Object.entries(attributes).forEach(([attName, attValue]) => {
      this.instanceRecordToSave.att(attName, attValue);
    });

    const att = this.type === PRE_SETTINGS_TYPES.FORM ? 'formRef?id' : 'journalRef?id';
    const newRef = this.type === PRE_SETTINGS_TYPES.FORM ? `${SourcesId.FORM}@${newRecordRef}` : `${SourcesId.JOURNAL}@${newRecordRef}`;

    if (newType) {
      const newTypeRecord = Records.get(newType.replace(SourcesId.TYPE, 'emodel/types-repo'));
      newTypeRecord.att(att, newRef);
      this.typeToSave = newTypeRecord;
    } else {
      this.typeToSave = null;
    }

    this.toggleLoading();
    this.handleCancel();
    isFunction(this.callback) && this.callback(newRef);
    isFunction(onHide) && onHide();
  };

  handleChangeForm = () => new Promise((resolve, reject) => {
    const { newRecordRef, newType } = this.state;
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
              this.recordRef = `uiserv/form@${newRecordRef}`;
            }

            if (!this.typeToSave) {
              isFunction(cb) && cb(newRef, newDefinition);
            }

            this.typeToSave &&
              this.typeToSave.save().then(() => {
                isFunction(cb) && cb(newRef, newDefinition);
              });
              
            isFunction(resolve) && resolve();

            this.rollback();
          });
        }
      };

      this.changeAttributes(attributes);
    };

    this.handleCancel();
    EcosFormBuilderUtils.__showEditorComponent('formBuilder', EcosFormBuilderModal, builderDefinition, onSubmit);
  });

  handleChangeJournal = () => {
    const { newRecordRef, newType } = this.state;

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
            onAfterHideModal: this.rollback,
            onPreSettingSubmit: (record, form) => {
              const data = get(form, 'submission.data');

              if (this.instanceRecordToSave) {
                for (const [newAtt, attValue] of Object.entries(data)) {
                  this.instanceRecordToSave.att(newAtt, attValue);
                }

                this.instanceRecordToSave.save().then(() => {
                  if (!this.typeToSave) {
                    goToJournalsPage({ journalId: newRecordRef });
                  }

                  this.typeToSave &&
                    this.typeToSave.save().then(() => {
                      if (!this.isFormType) {
                        goToJournalsPage({ journalId: newRecordRef, replaceJournal: true });
                      }
                    });

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

  render() {
    const { isOpen, isValid, message, isLoading, newRecordRef, newType } = this.state;

    return (
      <EcosModal title={t(Labels.MODAL_TITLE)} size="small" isOpen={isOpen} isLoading={isLoading} hideModal={this.handleCancel}>
        <div className="ecos-form-pre-settings">
          <Alert color="info">{t(Labels.INFO_TEXT)}</Alert>
          <Field label={t(Labels.ID)} labelPosition="top" isRequired>
            <Input value={newRecordRef} onChange={this.handleChangeRecordRef} type="text" />
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
