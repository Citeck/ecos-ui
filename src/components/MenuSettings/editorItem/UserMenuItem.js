import React from 'react';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';

import Base from './Base';
import { t } from '../../../helpers/export/util';
import { Labels } from '../utils';
import { MLText, SelectOrgstruct } from '../../common/form';
import { Field } from '../Field';
import { GroupTypes } from '../../common/form/SelectOrgstruct/constants';
import { MenuApi } from '../../../api/menu';

class UserMenuItem extends Base {
  #unmounted = false;

  type = 'user-menu-item';

  state = {
    ...super.state,
    label: {},
    allowedRefs: [],
    allowedNames: [],
    isFetching: false
  };

  componentDidMount() {
    super.componentDidMount();

    const { label, allowedFor: allowedNames } = this.props.item || {};

    this.#unmounted = false;

    this.setState({ label, allowedNames });
    this.getAuthoritiesInfoByName();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!isEqual(prevProps.item, this.props.item) && !isEmpty(get(this.props, 'item.allowedFor'))) {
      this.getAuthoritiesInfoByName();
    }
  }

  get permissions() {
    const permission = super.permissions;

    return {
      ...permission,
      hasIcon: true
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

    console.warn('handleApply => ', { self: this });

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
