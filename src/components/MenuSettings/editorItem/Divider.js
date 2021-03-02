import React from 'react';
import isEqual from 'lodash/isEqual';

import { packInLabel, t } from '../../../helpers/util';
import { MenuSettings } from '../../../constants/menu';
import { MLText } from '../../common/form';
import { Labels } from './../utils';
import { Field } from './../Field';
import Base from './Base';

export default class Divider extends Base {
  type = MenuSettings.ItemTypes.HEADER_DIVIDER;

  componentDidMount() {
    super.componentDidMount();
    const { label } = this.props.item || {};
    this.setState({ label });
  }

  handleApply() {
    super.handleApply();

    const { onSave } = this.props;
    const { label } = this.state;

    this.data.label = label;

    onSave(this.data);
  }

  isNotValid() {
    const { label } = this.state;
    const _label = packInLabel(label);

    return Object.values(_label).every(val => !val);
  }

  setLabel = label => {
    this.setState({ label });
  };

  render() {
    const { label } = this.state;

    return (
      <this.wrapperModal>
        <Field label={t(Labels.FIELD_NAME_LABEL)}>
          <MLText onChange={this.setLabel} value={label} />
        </Field>
      </this.wrapperModal>
    );
  }
}
