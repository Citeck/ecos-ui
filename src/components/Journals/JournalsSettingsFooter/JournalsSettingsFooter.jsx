import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isFunction from 'lodash/isFunction';

import { Btn } from '../../common/btns';
import Columns from '../../common/templates/Columns/Columns';
import { closest, t } from '../../../helpers/util';

import './JournalsSettingsFooter.scss';

class JournalsSettingsFooter extends Component {
  constructor(props) {
    super(props);
    this.state = { presetCreating: false };
  }

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
    if (e.key === 'Enter') {
      if (closest(e.target, this.props.parentClass)) {
        this.applySetting();
      }
    }
  };

  createSetting = () => {
    const { onCreate } = this.props;
    this.setState({ presetCreating: true });
    isFunction(onCreate) && onCreate();
  };

  saveSetting = () => {
    const { onSave } = this.props;
    isFunction(onSave) && onSave();
  };

  applySetting = () => {
    const { onApply } = this.props;
    isFunction(onApply) && onApply();
  };

  resetSettings = () => {
    const { onReset } = this.props;
    isFunction(onReset) && onReset();
  };

  render() {
    const { canSave } = this.props;
    const { presetCreating } = this.state;

    return (
      <>
        <Columns
          className="ecos-journal__settings-footer"
          cols={[
            <>
              <Btn className="ecos-btn_x-step_10" onClick={this.createSetting} disabled={presetCreating}>
                {t('journals.action.create-template')}
              </Btn>
              {canSave && <Btn onClick={this.saveSetting}>{t('journals.action.apply-template')}</Btn>}
            </>,

            <>
              <Btn className="ecos-btn_x-step_10 ecos-journal__settings-footer-action_reset" onClick={this.resetSettings}>
                {t('journals.action.reset')}
              </Btn>
              <Btn className={'ecos-btn_blue ecos-btn_hover_light-blue'} onClick={this.applySetting}>
                {t('journals.action.apply')}
              </Btn>
            </>
          ]}
          cfgs={[{}, { className: 'columns_right' }]}
        />
      </>
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
