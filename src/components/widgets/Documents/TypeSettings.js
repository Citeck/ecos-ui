import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { EcosModal, Tabs } from '../../common';
import { t } from '../../../helpers/util';
import { Btn } from '../../common/btns';
import { DynamicTypeInterface } from './propsInterfaces';

const Labels = {
  TITLE: 'documents-widget.type-settings.title',
  CANCEL_BUTTON: 'documents-widget.settings-modal.button.cancel',
  OK_BUTTON: 'documents-widget.settings-modal.button.ok',
  UPLOAD_LABEL: 'documents-widget.type-settings.upload-label',
  SORT_LABEL: 'documents-widget.type-settings.sort-label',
  ONE_FILE: 'documents-widget.type-settings.one-file',
  MULTIPLE_FILES: 'documents-widget.type-settings.multiple-files'
};
const FileCount = {
  ONE: 'one',
  MULTIPLE: 'multiple'
};

class TypeSettings extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    isLoading: PropTypes.bool,
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
    ]
  };

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (props.isOpen && !Object.keys(state.settings).length && Object.keys(props.type).length) {
      newState.settings = props.type;
    }

    if (!Object.keys(newState).length) {
      return null;
    }

    return newState;
  }

  get title() {
    const { type } = this.props;

    if (type === null) {
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

  renderCountFiles() {
    const { settings, countTabs } = this.state;

    if (settings === null) {
      return null;
    }

    return (
      <section className="ecos-docs__modal-type-settings-group">
        <div className="ecos-docs__modal-type-settings-label">{t(Labels.UPLOAD_LABEL)}</div>
        <Tabs
          className="ecos-docs__modal-type-settings-tabs"
          classNameTab="ecos-docs__modal-type-settings-tabs-item"
          items={countTabs}
          keyField="key"
          valueField="value"
          activeTabKey={settings.multiple ? FileCount.MULTIPLE : FileCount.ONE}
          onClick={this.handleChangeCountFiles}
        />
      </section>
    );
  }

  renderColumns() {
    return (
      <section className="ecos-docs__modal-type-settings-group">
        <div className="ecos-docs__modal-type-settings-label">{t(Labels.SORT_LABEL)}</div>
      </section>
    );
  }

  render() {
    const { isOpen, isLoading } = this.props;

    return (
      <EcosModal
        title={this.title}
        isOpen={isOpen}
        isLoading={isLoading}
        className="ecos-docs__modal-type-settings"
        hideModal={this.handleCloseModal}
      >
        {this.renderCountFiles()}
        {this.renderColumns()}
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
