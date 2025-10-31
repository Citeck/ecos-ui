import React from 'react';

import { t } from '../../../helpers/util';
import { MenuSettings } from '../../../constants/menu';
import { MLText } from '../../common/form';
import { Labels } from '../utils';
import { Field } from '../Field';
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

  isInvalidForm() {
    return this.isInvalidLabel;
  }

  setLabel = label => {
    this.setState({ label });
  };

  render() {
    const { label } = this.state;

    return (
      <this.wrapperModal>
        <Field label={t(Labels.FIELD_NAME_LABEL)} required>
          <MLText onChange={this.setLabel} value={label} />
        </Field>
      </this.wrapperModal>
    );
  }
}
