import React from 'react';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import merge from 'lodash/merge';
import cloneDeep from 'lodash/cloneDeep';

import { MenuApi } from '../../../api/menu';
import { t } from '../../../helpers/export/util';
import { MenuSettings } from '../../../constants/menu';
import { MLText, SelectOrgstruct } from '../../common/form';
import { GroupTypes } from '../../common/form/SelectOrgstruct/constants';
import { Labels } from '../utils';
import { Field } from '../Field';
import Base from './Base';

class UserMenuItem extends Base {
  #unmounted = false;
  #defaultState = {
    label: {},
    allowedRefs: [],
    allowedNames: [],
    isFetching: false
  };

  type = 'user-menu-item';

  state = {
    ...super.state,
    ...this.#defaultState
  };

  componentDidMount() {
    super.componentDidMount();
    const { item = {}, type = {} } = this.props || {};
    const data = cloneDeep(type.default);
    const { label, allowedFor: allowedNames, icon } = merge(data, item);

    this.#unmounted = false;

    this.setState({
      label,
      allowedNames,
      icon,
      defaultIcon: type.default.icon
    });
    this.getAuthoritiesInfoByName();
  }

  componentWillUnmount() {
    this.setState({ ...this.#defaultState });
  }

  get permissions() {
    const { item } = this.props;
    const permission = super.permissions;

    return {
      ...permission,
      hasIcon: item.type !== MenuSettings.ItemTypes.USER_STATUS
    };
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

  setLabel = label => {
    this.setState({ label });
  };

  handleApply() {
    super.handleApply();

    const { onSave } = this.props;
    const { label, allowedNames } = this.state;

    this.data.label = label;
    this.data.allowedFor = allowedNames;

    if (isFunction(onSave)) {
      onSave(this.data);
    }
  }

  handleSelectAllowed = (allowedRefs, items) => {
    this.setState({
      allowedRefs,
      allowedNames: (items || []).map(item => get(item, 'attributes.fullName'))
    });
  };

  render() {
    const { label, allowedRefs, isFetching } = this.state;

    return (
      <this.wrapperModal>
        <Field label={t(Labels.FIELD_NAME_LABEL)}>
          <MLText onChange={this.setLabel} value={label} />
        </Field>

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

export default UserMenuItem;
