import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import set from 'lodash/set';
import React from 'react';

import { Checkbox, MLText, SelectOrgstruct } from '../../common/form';
import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_ROLE, AUTHORITY_TYPE_USER, GroupTypes } from '../../common/form/SelectOrgstruct/constants';
import { Field } from '../Field';
import { Labels } from '../utils';

import Base from './Base';

import { MenuApi } from '@/api/menu';
import { MenuSettings } from '@/constants/menu';
import { t } from '@/helpers/util';

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

    const { label, allowedFor: allowedNames, config, collapsed } = this.props.item || {};
    const hiddenLabel = get(config, 'hiddenLabel');

    this.setState({ label, hiddenLabel, collapsed, allowedNames });
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

    MenuApi.getAuthoritiesInfo(get(this.props, 'item.allowedFor'), 'authorityName').then(allowedRefs => {
      if (this.#unmounted) {
        return;
      }

      this.setState({ isFetching: false, allowedRefs });
    });
  }

  handleApply() {
    super.handleApply();

    const { onSave } = this.props;
    const { label, hiddenLabel, allowedNames, collapsed } = this.state;
    const { hideableLabel } = this.permissions;

    this.data.label = label;
    this.data.allowedFor = allowedNames;
    this.data.collapsed = collapsed;
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

  setCollapsed = elm => {
    this.setState({ collapsed: elm.checked });
  };

  render() {
    const { collapsable, hideableLabel } = this.permissions;
    const { label, hiddenLabel, collapsed, allowedRefs, isFetching } = this.state;

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
        {collapsable && (
          <Field>
            <Checkbox checked={collapsed} onChange={this.setCollapsed} className="ecos-checkbox_flex">
              {t(Labels.FIELD_COLLAPSED)}
            </Checkbox>
          </Field>
        )}
        <Field label={t(Labels.FIELD_ALLOWED_FOR_LABEL)}>
          <SelectOrgstruct
            allowedAuthorityTypes={[AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER, AUTHORITY_TYPE_ROLE]}
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
