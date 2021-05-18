import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';

import { EcosModal } from '../../../common';
import { Btn } from '../../../common/btns';
import { objectCompare, t } from '../../../../helpers/util';
import { DynamicTypeInterface, TypeSettingsInterface } from '../propsInterfaces';
import { Checkbox, Radio } from '../../../common/form';
import SelectJournal from '../../../common/form/SelectJournal';

const Labels = {
  TITLE: 'documents-widget.type-settings.title',
  CANCEL_BUTTON: 'documents-widget.settings-modal.button.cancel',
  OK_BUTTON: 'documents-widget.settings-modal.button.ok',
  UPLOAD_LABEL: 'documents-widget.type-settings.allowed-number-files',
  JOURNAL_SETTINGS_LABEL: 'documents-widget.type-settings.journal',
  SORT_LABEL: 'documents-widget.type-settings.sort-label',
  ONE_FILE: 'documents-widget.type-settings.one-file',
  MULTIPLE_FILES: 'documents-widget.type-settings.multiple-files',
  POSSIBLE_UPLOAD_FILE: 'documents-widget.type-settings.allow-file-upload'
};
const FileCount = {
  ONE: 'one',
  MULTIPLE: 'multiple'
};

class TypeSettings extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    isLoading: PropTypes.bool,
    settings: PropTypes.shape(TypeSettingsInterface),
    type: PropTypes.oneOfType([() => null, PropTypes.shape(DynamicTypeInterface)]),
    onCancel: PropTypes.func,
    onSave: PropTypes.func
  };

  static defaultProps = {
    isOpen: false,
    isLoading: false,
    onCancel: () => {},
    onSave: () => {}
  };

  state = {
    settings: {},
    countTabs: [
      {
        key: FileCount.ONE,
        value: t(Labels.ONE_FILE)
      },
      {
        key: FileCount.MULTIPLE,
        value: t(Labels.MULTIPLE_FILES)
      }
    ],
    draggableNode: null
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!objectCompare(prevProps.settings, this.props.settings) || isEmpty(this.state.settings)) {
      this.setState({ settings: this.props.settings });
    }
  }

  get title() {
    const { type } = this.props;

    if (type === null || !type.name) {
      return t(Labels.TITLE);
    }

    return `${type.name} - ${t(Labels.TITLE)}`;
  }

  handleCloseModal = () => {
    this.setState({ settings: {} });
    this.props.onCancel();
  };

  handleClickSave = () => {
    this.props.onSave(this.state.settings);
    this.setState({ settings: {} });
  };

  handleChangeCountFiles = index => {
    this.setState(state => ({
      ...state,
      settings: {
        ...state.settings,
        multiple: state.countTabs[index].key === FileCount.MULTIPLE
      }
    }));
  };

  handleToggleUploadFile = ({ checked }) => {
    this.setState(state => ({
      ...state,
      settings: {
        ...state.settings,
        canUpload: checked
      }
    }));
  };

  handleSelectJournal = journalId => {
    this.setState(state => ({
      ...state,
      settings: {
        ...state.settings,
        journalId
      }
    }));
  };

  renderCountFiles() {
    const { settings, countTabs } = this.state;

    if (settings === null) {
      return null;
    }

    return (
      <section className="ecos-docs__modal-type-settings-group">
        <div className="ecos-docs__modal-type-settings-label">{t(Labels.UPLOAD_LABEL)}</div>
        <div className="ecos-docs__modal-type-settings-tabs">
          {countTabs.map((tab, index) => (
            <Radio
              key={tab.key}
              label={tab.value}
              name="countTabs"
              checked={settings.multiple === (tab.key === FileCount.MULTIPLE)}
              onChange={() => this.handleChangeCountFiles(index)}
            />
          ))}
        </div>
      </section>
    );
  }

  renderSelectJournal() {
    const { type } = this.props;
    const { settings } = this.state;

    if (settings === null || type === null) {
      return null;
    }

    return (
      <section className="ecos-docs__modal-type-settings-group">
        <div className="ecos-docs__modal-type-settings-label">{t(Labels.JOURNAL_SETTINGS_LABEL)}</div>
        <div className="ecos-docs__modal-type-settings-tabs">
          <SelectJournal
            journalId="ecos-journals"
            defaultValue={type.journalId}
            hideCreateButton
            onChange={this.handleSelectJournal}
            onCancel={() => this.handleSelectJournal()}
          />
        </div>
      </section>
    );
  }

  render() {
    const { isOpen, isLoading } = this.props;
    const { settings } = this.state;

    return (
      <EcosModal
        title={this.title}
        isOpen={isOpen}
        isLoading={isLoading}
        className="ecos-docs__modal-type-settings"
        hideModal={this.handleCloseModal}
      >
        <Checkbox className="ecos-docs__modal-checkbox" onChange={this.handleToggleUploadFile} checked={settings.canUpload}>
          {t(Labels.POSSIBLE_UPLOAD_FILE)}
        </Checkbox>

        {this.renderCountFiles()}

        {this.renderSelectJournal()}

        <div className="ecos-docs__modal-type-settings-footer">
          <Btn onClick={this.handleCloseModal} className="ecos-docs__modal-settings-footer-item">
            {t(Labels.CANCEL_BUTTON)}
          </Btn>
          <Btn onClick={this.handleClickSave} className="ecos-btn_blue ecos-docs__modal-settings-footer-item">
            {t(Labels.OK_BUTTON)}
          </Btn>
        </div>
      </EcosModal>
    );
  }
}

export default TypeSettings;
