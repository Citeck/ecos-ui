import Formio from 'formiojs/Formio';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import split from 'lodash/split';
import React from 'react';
import ReactDOM from 'react-dom';

import UnreadableLabel from '../../UnreadableLabel';
import BaseComponent from '../base/BaseComponent';

import { OrgStructApi } from '@/api/orgStruct.js';
import { FORM_MODE_CREATE } from '@/components/EcosForm';
import SelectOrgstruct from '@/components/common/form/SelectOrgstruct';
import {
  AUTHORITY_TYPE_GROUP,
  AUTHORITY_TYPE_USER,
  DataTypes,
  GroupTypes,
  ROOT_GROUP_NAME,
  TabTypes,
  ViewModes
} from '@/components/common/form/SelectOrgstruct/constants';

const _array = (str, checkForEmpty) => {
  if (checkForEmpty && !str) {
    return [];
  }

  return split(str, ',').map(item => item.trim());
};

export default class SelectOrgstructComponent extends BaseComponent {
  _root = null;

  static schema(...extend) {
    return BaseComponent.schema(
      {
        label: 'SelectOrgstruct',
        key: 'selectOrgstruct',
        type: 'selectOrgstruct',
        allowedAuthorityType: [AUTHORITY_TYPE_USER, AUTHORITY_TYPE_GROUP].join(', '),
        allowedGroupType: [GroupTypes.ROLE, GroupTypes.BRANCH].join(', '),
        rootGroupName: ROOT_GROUP_NAME,
        customRootGroupName: '',
        allowedGroupSubType: '',
        currentUserByDefault: false,
        excludeAuthoritiesByName: '',
        excludeAuthoritiesByType: '',
        modalTitle: '',
        isSelectedValueAsText: false,
        isSkipSearchInWorkspace: false,
        hideTabSwitcher: false,
        defaultTab: TabTypes.LEVELS,
        dataType: DataTypes.NODE_REF,
        userSearchExtraFields: '',
        isIncludedAdminGroup: false,
        viewModeType: ViewModes.DEFAULT
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
        // TODO: Figure out how to make the changes from createRoot invisible
        //  (it will first unmount the component completely, then it will mount)
        // this._root = createRoot(this.reactContainer);
        // eslint-disable-next-line react/no-deprecated
        ReactDOM.render(<UnreadableLabel />, this.reactContainer);
        return;
      }

      // TODO: Figure out how to make the changes from createRoot invisible
      //  (it will first unmount the component completely, then it will mount)
      // this._root = createRoot(this.reactContainer);
      // eslint-disable-next-line react/no-deprecated
      ReactDOM.render(
        <SelectOrgstruct
          defaultValue={this.dataValue}
          isCompact={comp.isCompact}
          multiple={comp.multiple}
          placeholder={comp.placeholder}
          disabled={comp.disabled}
          allowedAuthorityTypes={allowedAuthorityTypes}
          allowedGroupTypes={allowedGroupTypes}
          rootGroupName={this._getRootGroup()}
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
          isSkipSearchInWorkspace={comp.isSkipSearchInWorkspace}
          onChange={this.onValueChange}
          onError={console.error}
          viewModeType={comp.viewModeType}
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
    this.updateValue({ modified: true, changeByUser: true }, value === null ? this.emptyValue : value);
    this.refreshDOM();
  };

  updateValue(flags, value) {
    return super.updateValue(flags, value);
  }

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

  _getRootGroup() {
    const { customRootGroupName, rootGroupName } = this.component;

    if (customRootGroupName) {
      return this.evaluate(customRootGroupName, {}, 'value', '');
    }

    return rootGroupName || ROOT_GROUP_NAME;
  }

  setValue(value, flags) {
    if (isEqual(value, this.dataValue) && !isEmpty(value)) {
      return;
    }

    this.dataValue = value;

    if (
      this.pristine && // Cause: https://citeck.atlassian.net/browse/ECOSCOM-3241
      isEqual(value, this.emptyValue) &&
      this.component.currentUserByDefault &&
      !this.viewOnly &&
      this.options.formMode === FORM_MODE_CREATE
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
