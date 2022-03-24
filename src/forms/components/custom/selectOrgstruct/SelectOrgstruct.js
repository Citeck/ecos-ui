import React from 'react';
import ReactDOM from 'react-dom';
import Formio from 'formiojs/Formio';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import split from 'lodash/split';

import { OrgStructApi } from '../../../../api/orgStruct';
import SelectOrgstruct from '../../../../components/common/form/SelectOrgstruct';
import {
  AUTHORITY_TYPE_GROUP,
  AUTHORITY_TYPE_USER,
  DataTypes,
  GroupTypes,
  ROOT_GROUP_NAME,
  TabTypes
} from '../../../../components/common/form/SelectOrgstruct/constants';
import BaseComponent from '../base/BaseComponent';
import UnreadableLabel from '../../UnreadableLabel';

const _array = (str, checkForEmpty) => {
  if (checkForEmpty && !str) {
    return [];
  }

  return split(str, ',').map(item => item.trim());
};

export default class SelectOrgstructComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        label: 'SelectOrgstruct',
        key: 'selectOrgstruct',
        type: 'selectOrgstruct',
        allowedAuthorityType: [AUTHORITY_TYPE_USER, AUTHORITY_TYPE_GROUP].join(', '),
        allowedGroupType: [GroupTypes.ROLE, GroupTypes.BRANCH].join(', '),
        rootGroupName: ROOT_GROUP_NAME,
        allowedGroupSubType: '',
        currentUserByDefault: false,
        excludeAuthoritiesByName: '',
        excludeAuthoritiesByType: '',
        modalTitle: '',
        isSelectedValueAsText: false,
        hideTabSwitcher: false,
        defaultTab: TabTypes.LEVELS,
        dataType: DataTypes.NODE_REF,
        userSearchExtraFields: '',
        isIncludedAdminGroup: false
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Select Orgstruct',
      icon: 'fa fa-th-list',
      group: 'advanced',
      weight: 0,
      schema: SelectOrgstructComponent.schema()
    };
  }

  get defaultSchema() {
    return SelectOrgstructComponent.schema();
  }

  get emptyValue() {
    return this.component.multiple ? [] : '';
  }

  /**
   * Check if a component is eligible for multiple validation (Cause: https://citeck.atlassian.net/browse/ECOSCOM-2489)
   *
   * @return {boolean}
   */
  validateMultiple() {
    return false;
  }

  createViewOnlyValue(container) {
    this.reactContainer = this.ce('dd');
    container.appendChild(this.reactContainer);
    this.createInlineEditButton(container);
    this.renderReactComponent();
  }

  build() {
    if (this.viewOnly) {
      return this.viewOnlyBuild();
    }

    this.restoreValue();

    this.createElement();

    const labelAtTheBottom = this.component.labelPosition === 'bottom';
    if (!labelAtTheBottom) {
      this.createLabel(this.element);
    }

    this.reactContainer = this.ce('div');
    this.element.appendChild(this.reactContainer);

    if (this.shouldDisable) {
      this.disabled = true;
    }

    this.errorContainer = this.element;
    this.createErrorElement();

    this.renderReactComponent();

    // this.setInputStyles(this.inputsContainer);

    if (labelAtTheBottom) {
      this.createLabel(this.element);
    }

    this.createDescription(this.element);

    this.createInlineEditSaveAndCancelButtons();

    this.attachRefreshOn();
    // this.autofocus();
    this.attachLogic();
  }

  renderReactComponent = (config = {}) => {
    const comp = this.component;
    const allowedAuthorityType = comp.allowedAuthorityType || '';
    const allowedGroupType = comp.allowedGroupType || '';
    const allowedGroupSubType = (comp.allowedGroupSubType || '').trim();
    const userSearchExtraFieldsStr = comp.userSearchExtraFields || '';

    const allowedAuthorityTypes = _array(allowedAuthorityType);
    const allowedGroupTypes = _array(allowedGroupType);
    const allowedGroupSubTypes = _array(allowedGroupSubType, true);
    const userSearchExtraFields = _array(userSearchExtraFieldsStr, true);
    const excludeAuthoritiesByType = _array(comp.excludeAuthoritiesByType, true);

    let renderControl = () => {
      if (comp.unreadable) {
        ReactDOM.render(<UnreadableLabel />, this.reactContainer);
        return;
      }

      ReactDOM.render(
        <SelectOrgstruct
          defaultValue={this.dataValue}
          isCompact={comp.isCompact}
          multiple={comp.multiple}
          placeholder={comp.placeholder}
          disabled={comp.disabled}
          allowedAuthorityTypes={allowedAuthorityTypes}
          allowedGroupTypes={allowedGroupTypes}
          rootGroupName={comp.rootGroupName || ROOT_GROUP_NAME}
          allowedGroupSubTypes={allowedGroupSubTypes}
          excludeAuthoritiesByName={comp.excludeAuthoritiesByName}
          excludeAuthoritiesByType={excludeAuthoritiesByType}
          userSearchExtraFields={userSearchExtraFields}
          viewOnly={this.viewOnly}
          hideTabSwitcher={comp.hideTabSwitcher}
          defaultTab={comp.defaultTab}
          dataType={comp.dataType}
          modalTitle={comp.modalTitle ? this.t(comp.modalTitle) : null}
          isSelectedValueAsText={comp.isSelectedValueAsText}
          isIncludedAdminGroup={comp.isIncludedAdminGroup}
          onChange={this.onValueChange}
          onError={console.error}
        />,
        this.reactContainer
      );
    };

    renderControl();
  };

  refreshDOM = () => {
    this.reactContainer && this.renderReactComponent();
  };

  onValueChange = value => {
    this.updateValue({}, value);
    this.refreshDOM();
  };

  _getAuthorityRef = (authority, callback) => {
    this._requestedAuthority = authority;

    if (!authority) {
      callback(authority);
      return;
    }

    OrgStructApi.prepareRecordRef(authority).then(({ recordRef }) => {
      callback(recordRef);
    });
  };

  getValue() {
    return this.dataValue;
  }

  setValue(value, flags) {
    if (isEqual(value, this.dataValue) && !isEmpty(value)) {
      return;
    }

    if (
      this.pristine && // Cause: https://citeck.atlassian.net/browse/ECOSCOM-3241
      isEqual(value, this.emptyValue) &&
      this.component.currentUserByDefault &&
      !this.viewOnly &&
      this.options.formMode === 'CREATE'
    ) {
      const currentUser = (Formio.getUser() || '').toLowerCase();

      value = Array.isArray(value) ? [currentUser] : currentUser;
    }

    const setValueImpl = v => {
      const val = v || this.component.defaultValue || this.emptyValue;
      this.updateValue(flags, val);
      this.refreshDOM();
    };

    if (Array.isArray(value)) {
      const promises = value.map(auth => new Promise(resolve => this._getAuthorityRef(auth, resolve)));
      Promise.all(promises).then(setValueImpl);
    } else {
      this._getAuthorityRef(value, setValueImpl);
    }
  }
}
