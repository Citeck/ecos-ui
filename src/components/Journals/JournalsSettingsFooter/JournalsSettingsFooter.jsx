import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isFunction from 'lodash/isFunction';

import { t } from '../../../helpers/export/util';
import { Btn } from '../../common/btns';
import { Labels } from '../constants';

import './JournalsSettingsFooter.scss';

class JournalsSettingsFooter extends Component {
  componentDidMount() {
    this.createKeydownEvents();
  }

  componentWillUnmount() {
    this.removeKeydownEvents();
  }

  createKeydownEvents() {
    document.addEventListener('keydown', this.onKeydown);
  }

  removeKeydownEvents() {
    document.removeEventListener('keydown', this.onKeydown);
  }

  onKeydown = e => {
    const { key, target } = e;
    const selector = `.${this.props.parentClass}`;

    if (key === 'Enter' && target && (target.closest(selector) || target.querySelector(selector))) {
      this.applySetting();
    }
  };

  createSetting = e => {
    const { onCreate } = this.props;
    e.currentTarget.blur();
    isFunction(onCreate) && onCreate();
  };

  saveSetting = e => {
    const { onSave } = this.props;
    e.currentTarget.blur();
    isFunction(onSave) && onSave();
  };

  applySetting = () => {
    const { onApply } = this.props;
    isFunction(onApply) && onApply();
  };

  resetSettings = e => {
    const { onReset } = this.props;
    e.currentTarget.blur();
    isFunction(onReset) && onReset();
  };

  render() {
    const { canSave } = this.props;

    return (
      <div className="ecos-journal__settings-footer">
        <Btn onClick={this.createSetting}>{t(Labels.Settings.CREATE_PRESET)}</Btn>
        {canSave && <Btn onClick={this.saveSetting}>{t(Labels.Settings.APPLY_PRESET)}</Btn>}
        <div className="ecos-journal__settings-footer-space" />
        <Btn className="ecos-journal__settings-footer-action_reset" onClick={this.resetSettings}>
          {t(Labels.Settings.RESET)}
        </Btn>
        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.applySetting}>
          {t(Labels.Settings.APPLY)}
        </Btn>
      </div>
    );
  }
}

JournalsSettingsFooter.propTypes = {
  parentClass: PropTypes.string,
  canSave: PropTypes.bool,

  onApply: PropTypes.func,
  onCreate: PropTypes.func,
  onReset: PropTypes.func,
  onSave: PropTypes.func
};

export default JournalsSettingsFooter;
