import PropTypes from 'prop-types';
import React from 'react';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import { Btn } from '../../common/btns';
import { Caption, Checkbox, Field } from '../../common/form';
import { Labels } from './util';

import './style.scss';

export default class Settings extends React.Component {
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
      displayHeatmapToolbar: get(props, 'config.displayHeatmapToolbar')
    };
  }

  handleCancel = () => this.props.onCancel();

  handleSave = () => {
    this.props.onSave({ ...this.state });
  };

  handleChangeDocList = () => {};

  render() {
    return (
      <div className="ecos-doc-preview-settings">
        <Caption middle className="ecos-doc-preview-settings__title">
          {t(Labels.SETTINGS_TITLE)}
        </Caption>
        <Field label={Labels.SETTINGS_TITLE} labelPosition="top">
          <Checkbox checked onClick={this.handleChangeDocList} />
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
