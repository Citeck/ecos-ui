import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import { Btn } from '../../common/btns';
import { Caption, Checkbox, Field } from '../../common/form';
import { Labels } from './util';

import './style.scss';

export default class Settings extends Component {
  static propTypes = {
    config: PropTypes.object,
    onSave: PropTypes.func,
    onCancel: PropTypes.func
  };

  static defaultProps = {
    config: {}
  };

  constructor(props) {
    super(props);

    this.state = {
      showAllDocuments: get(props, 'config.showAllDocuments')
    };
  }

  handleCancel = () => this.props.onCancel();

  handleSave = () => this.props.onSave({ ...this.state });

  handleChangeField = keyFlag => this.setState({ [keyFlag]: !this.state[keyFlag] });

  render() {
    const { showAllDocuments } = this.state;

    return (
      <div className="ecos-doc-preview-settings">
        <Caption middle className="ecos-doc-preview-settings__title">
          {t(Labels.SETTINGS_TITLE)}
        </Caption>
        <Caption small className="ecos-doc-preview-settings__title">
          {t(Labels.SETTINGS_TOOLBAR)}
        </Caption>
        <Field label={t(Labels.SETTINGS_FIELD_ALL_DOCS)} labelPosition="top">
          <Checkbox checked={showAllDocuments} onClick={() => this.handleChangeField('showAllDocuments')} />
        </Field>
        <div className="ecos-doc-preview-settings__buttons">
          <Btn className="ecos-btn_hover_light-blue" onClick={this.handleCancel}>
            {t(Labels.SETTINGS_BTN_CANCEL)}
          </Btn>
          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleSave}>
            {t(Labels.SETTINGS_BTN_SAVE)}
          </Btn>
        </div>
      </div>
    );
  }
}
