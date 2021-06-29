import React from 'react';
import set from 'lodash/set';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../helpers/util';
import { MenuSettings } from '../../../constants/menu';
import { Checkbox, MLText, SelectOrgstruct } from '../../common/form';
import { Labels } from '../utils';
import { Field } from '../Field';
import Base from './Base';
import { GroupTypes } from '../../common/form/SelectOrgstruct/constants';
import { MenuApi } from '../../../api/menu';

export default class Section extends Base {
  #unmounted = false;

  type = MenuSettings.ItemTypes.SECTION;

  state = {
    ...super.state,
    allowedRefs: [],
    allowedNames: [],
    isFetching: false
  };

  componentDidMount() {
    super.componentDidMount();

    this.#unmounted = false;

    const { label, allowedFor: allowedNames, config } = this.props.item || {};
    const hiddenLabel = get(config, 'hiddenLabel');

    this.setState({ label, hiddenLabel, allowedNames });
    this.getAuthoritiesInfoByName();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!isEqual(prevProps.item, this.props.item) && !isEmpty(get(this.props, 'item.allowedFor'))) {
      this.getAuthoritiesInfoByName();
    }
  }

  componentWillUnmount() {
    this.#unmounted = true;
  }

  getAuthoritiesInfoByName() {
    this.setState({ isFetching: true });

    MenuApi.getAuthoritiesInfoByName(get(this.props, 'item.allowedFor'), 'nodeRef').then(allowedRefs => {
      if (this.#unmounted) {
        return;
      }

      this.setState({ isFetching: false, allowedRefs });
    });
  }

  handleApply() {
    super.handleApply();

    const { onSave } = this.props;
    const { label, hiddenLabel, allowedNames } = this.state;
    const { hideableLabel } = this.permissions;

    this.data.label = label;
    this.data.allowedFor = allowedNames;
    hideableLabel && set(this.data, 'config.hiddenLabel', hiddenLabel);

    onSave(this.data);
  }

  handleSelectAllowed = (allowedRefs, items) => {
    this.setState({
      allowedRefs,
      allowedNames: (items || []).map(item => get(item, 'attributes.fullName'))
    });
  };

  isInvalidForm() {
    const { hiddenLabel } = this.state;

    return !hiddenLabel && this.isInvalidLabel;
  }

  setLabel = label => {
    this.setState({ label });
  };

  setHiddenLabel = elm => {
    this.setState({ hiddenLabel: elm.checked });
  };

  render() {
    const { hideableLabel } = this.permissions;
    const { label, hiddenLabel, allowedRefs, isFetching } = this.state;

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
        <Field label={t(Labels.FIELD_ALLOWED_FOR_LABEL)}>
          <SelectOrgstruct
            isLoading={isFetching}
            defaultValue={allowedRefs}
            multiple
            isSelectedValueAsText
            isIncludedAdminGroup
            placeholder={t(Labels.FIELD_ALLOWED_FOR_PLACEHOLDER)}
            allowedGroupTypes={Object.values(GroupTypes)}
            onChange={this.handleSelectAllowed}
          />
        </Field>
      </this.wrapperModal>
    );
  }
}
