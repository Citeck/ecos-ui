import React from 'react';
import set from 'lodash/set';

import { packInLabel, t } from '../../../helpers/util';
import { MenuSettings } from '../../../constants/menu';
import { Checkbox, MLText } from '../../common/form';
import { Labels } from './../utils';
import { Field } from './../Field';
import Base from './Base';

export default class Section extends Base {
  type = MenuSettings.ItemTypes.SECTION;

  componentDidMount() {
    super.componentDidMount();
    const { label, hiddenLabel } = this.props.item || {};
    this.setState({ label, hiddenLabel });
  }

  handleApply() {
    super.handleApply();

    const { onSave } = this.props;
    const { label, hiddenLabel } = this.state;
    const { hideableLabel } = this.permissions;

    this.data.label = label;
    hideableLabel && set(this.data, 'config.hiddenLabel', hiddenLabel);

    onSave(this.data);
  }

  isNotValid() {
    const { label, hiddenLabel } = this.state;
    const _label = packInLabel(label);

    return !hiddenLabel && Object.values(_label).every(val => !val);
  }

  setLabel = label => {
    this.setState({ label });
  };

  setHiddenLabel = elm => {
    this.setState({ hiddenLabel: elm.checked });
  };

  render() {
    const { hideableLabel } = this.permissions;
    const { label, hiddenLabel } = this.state;

    return (
      <this.wrapperModal>
        <Field label={t(Labels.FIELD_NAME_LABEL)} required={!hiddenLabel}>
          <MLText onChange={this.setLabel} value={label} disabled={hiddenLabel} />
        </Field>
        {hideableLabel && (
          <Field>
            <Checkbox checked={hiddenLabel} onChange={this.setHiddenLabel} className="ecos-checkbox_flex">
              {t(Labels.FIELD_HIDE_NAME_LABEL)}
            </Checkbox>
          </Field>
        )}
      </this.wrapperModal>
    );
  }
}
