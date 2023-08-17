import React from 'react';
import { Alert } from 'reactstrap';
import isFunction from 'lodash/isFunction';

import { EcosModal } from '../common';
import { Btn } from '../common/btns';
import { t } from '../../helpers/util';
import { Field, Input, SelectJournal } from '../common/form';
import { SourcesId, SystemJournals } from '../../constants';
import { goToJournalsPage } from '../../helpers/urls';
import { EcosFormBuilderUtils } from '../EcosForm';
import EcosFormBuilderModal from '../EcosForm/builder/EcosFormBuilderModal';
import { PREDICATE_EQ } from '../Records/predicates/predicates';
import Records from '../Records/Records';

import './PreSettingsModal.style.scss';

const Labels = {
  ID: 'ecos-form.new-record-ref.id',
  TYPES: 'ecos-form.create-new-form.types',
  MODAL_TITLE: 'ecos-form.create-new-form',
  INFO_TEXT: 'ecos-form.create-new-form-info-text',
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
      newRecordRef: '',
      newTypes: [],
      isLoading: false
    };
  }

  componentDidMount() {
    this.fetchTypes();
  }

  hide = () => this.setState({ isOpen: false });

  toggleLoading = () => this.setState(prevState => ({ isLoading: !prevState.isLoading }));

  checkValidity = () => {
    const { newRecordRef } = this.state;

    this.setState({
      isValid: newRecordRef
    });
  };

  fetchTypes = () => {
    if (!this.recordRef) {
      return;
    }

    Records.query({
      sourceId: SourcesId.TYPE,
      language: 'predicate',
      query: {
        t: PREDICATE_EQ,
        a: this.isFormType ? 'formRef' : 'journalRef',
        v: this.recordRef
      }
    }).then(result => {
      this.handleChangeTypes(result.records);
    });
  };

  handleChangeRecordRef = event => {
    this.setState({ newRecordRef: event.target.value }, this.checkValidity);
  };

  handleChangeTypes = newTypes => {
    this.setState({ newTypes }, this.checkValidity);
  };

  handleSave = () => {
    if (this.isFormType) {
      this.handleChangeForm();
      return;
    }

    this.handleChangeJournal();
  };

  saveInstances = (attributes = {}) => {
    this.toggleLoading();
    const { newRecordRef, newTypes } = this.state;

    const instanceRecord = Records.get(this.recordRef);

    instanceRecord.att('id', newRecordRef);

    Object.entries(attributes).forEach(([attName, attValue]) => {
      instanceRecord.att(attName, attValue);
    });

    const att = this.type === PRE_SETTINGS_TYPES.FORM ? 'formRef?id' : 'journalRef?id';
    const newRef = this.type === PRE_SETTINGS_TYPES.FORM ? `${SourcesId.FORM}@${newRecordRef}` : `${SourcesId.JOURNAL}@${newRecordRef}`;

    instanceRecord.save().then(() => {
      Promise.all(
        newTypes.map(newType => {
          const newTypeRecord = Records.get(newType.replace(SourcesId.TYPE, 'emodel/types-repo'));
          newTypeRecord.att(att, newRef);

          return newTypeRecord.save();
        })
      ).then(() => {
        this.toggleLoading();
        this.hide();
        isFunction(this.callback) && this.callback(newRef);
      });
    });
  };

  handleChangeForm = () => {
    const { definition } = this.config;

    const onSubmit = newDefinition => {
      const attributes = {
        'definition?json': newDefinition
      };

      const cb = this.callback;
      this.callback = newRef => {
        isFunction(cb) && cb(newRef, newDefinition);
      };

      this.saveInstances(attributes);
    };

    this.hide();
    EcosFormBuilderUtils.__showEditorComponent('formBuilder', EcosFormBuilderModal, definition, onSubmit);
  };

  handleChangeJournal = () => {
    const { newRecordRef } = this.state;

    const cb = this.callback;

    this.callback = newRef => {
      goToJournalsPage({ journalId: newRecordRef });
      isFunction(cb) && cb(newRef);
    };

    this.saveInstances();
  };

  render() {
    const { isOpen, isValid, isLoading, newRecordRef, newTypes } = this.state;

    return (
      <EcosModal title={t(Labels.MODAL_TITLE)} size="small" isOpen={isOpen} isLoading={isLoading} hideModal={this.hide}>
        <div className="ecos-form-pre-settings">
          <Alert color="info">{t(Labels.INFO_TEXT)}</Alert>
          <Field label={t(Labels.ID)} labelPosition="top" isRequired>
            <Input value={newRecordRef} onChange={this.handleChangeRecordRef} type="text" />
          </Field>
          <Field label={t(Labels.TYPES)} isSmall={this.isSmall} isRequired>
            <SelectJournal
              journalId={SystemJournals.TYPES}
              defaultValue={newTypes}
              multiple
              hideCreateButton
              isSelectedValueAsText
              onChange={this.handleChangeTypes}
            />
          </Field>
          <div className="ecos-form-pre-settings__buttons">
            <Btn className="ecos-btn_hover_light-blue" onClick={this.hide}>
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
