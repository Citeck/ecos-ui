import React, { Component } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import isFunction from 'lodash/isFunction';

import { t } from '../../../helpers/export/util';
import { Btn } from '../../common/btns';
import { Labels } from '../constants';

import './JournalsSettingsFooter.scss';

class JournalsSettingsFooter extends Component {
  state = {
    disabledApply: false
  };

  componentDidMount() {
    this.createKeydownEvents();
  }

  componentWillUnmount() {
    this.removeKeydownEvents();
  }

  createKeydownEvents() {
    document.addEventListener('keydown', this.onKeydown, { capture: true });
  }

  removeKeydownEvents() {
    document.removeEventListener('keydown', this.onKeydown);
  }

  onKeydown = e => {
    const { key, target } = e;
    const selector = `.${this.props.parentClass}`;

    if (key === 'Enter' && target && (target.closest(selector) || target.querySelector(selector))) {
      debounce(this.applySetting, 360)();
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
    if (this.state.disabledApply) {
      return;
    }

    this.setState({ disabledApply: true }, () => {
      const { onApply } = this.props;
      isFunction(onApply) && onApply();
    });
  };

  resetSettings = e => {
    const { onReset } = this.props;
    e.currentTarget.blur();
    isFunction(onReset) && onReset();
  };

  render() {
    const { canSave, noCreateBtn } = this.props;
    const { disabledApply } = this.state;

    return (
      <div className="ecos-journal__settings-footer">
        {!noCreateBtn && <Btn onClick={this.createSetting}>{t(Labels.Settings.CREATE_PRESET)}</Btn>}
        {!noCreateBtn && canSave && <Btn onClick={this.saveSetting}>{t(Labels.Settings.APPLY_PRESET)}</Btn>}
        <div className="ecos-journal__settings-footer-space" />
        <Btn className="ecos-journal__settings-footer-action_reset" onClick={this.resetSettings}>
          {t(Labels.Settings.RESET)}
        </Btn>
        <Btn
          className="ecos-btn_blue ecos-btn_hover_light-blue"
          onClick={this.applySetting}
          disabled={disabledApply}
          loading={disabledApply}
        >
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
