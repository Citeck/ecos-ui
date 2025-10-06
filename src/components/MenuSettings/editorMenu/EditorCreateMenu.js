import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import React from 'react';
import { connect } from 'react-redux';

import DialogManager from '../../common/dialogs/Manager';
import { ControlledCheckbox, SelectOrgstruct } from '../../common/form';
import { GroupTypes, ViewModes, DataTypes } from '../../common/form/SelectOrgstruct/constants';
import { Labels } from '../utils';

import BaseEditorMenu from './BaseEditorMenu';

import {
  addJournalMenuItems,
  setCreateMenuItems,
  setLastAddedCreateItems,
  setIsForAllCreateMenu,
  setAuthoritiesCreateMenu
} from '@/actions/menuSettings';
import { ConfigTypes } from '@/constants/menu';
import { t } from '@/helpers/util';

class EditorCreateMenu extends BaseEditorMenu {
  configType = ConfigTypes.CREATE;

  handleToggleForAll = checked => {
    const { isForAll, authorityRefs } = this.props;

    if (checked === isForAll) {
      return;
    }

    if (checked && authorityRefs.length) {
      DialogManager.confirmDialog({
        title: Labels.DIALOG_FOR_ALL_TITLE,
        text: Labels.DIALOG_FOR_ALL_TEXT,
        onNo: () => this.props.setIsForAll(false),
        onYes: () => {
          this.props.getAuthorityInfoByRefs([]);
          this.props.setIsForAll(true);
        }
      });
    } else {
      this.props.setIsForAll(checked);
    }
  };

  handleSelectOrg = data => {
    if (!isEmpty(data)) {
      this.props.setIsForAll(false);
    }

    this.props.setAuthorities(data);
  };

  renderExtraSettings() {
    const { authorityRefs, disabledEdit, isForAll } = this.props;

    return (
      <div className="mt-3 ecos-menu-settings-ownership">
        <div className="ecos-menu-settings__title">{t(Labels.TITLE_OWNERSHIP)}</div>
        <ControlledCheckbox className="ecos-menu-settings-ownership__field-for-all" checked={isForAll} onClick={this.handleToggleForAll}>
          {t(Labels.FIELD_FOR_ALL_USERS)}
        </ControlledCheckbox>
        <SelectOrgstruct
          defaultValue={authorityRefs}
          dataType={DataTypes.AUTHORITY}
          multiple
          onChange={this.handleSelectOrg}
          isSelectedValueAsText
          viewOnly={disabledEdit}
          viewModeType={ViewModes.TAGS}
          allowedGroupTypes={Object.values(GroupTypes)}
          isIncludedAdminGroup
          disabled={isForAll}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  disabledEdit: get(state, 'menuSettings.disabledEdit'),
  items: get(state, 'menuSettings.createMenu.items', []),
  fontIcons: get(state, 'menuSettings.fontIcons', []),
  lastAddedItems: get(state, 'menuSettings.createMenu.lastAddedCreateItems', []),
  isForAll: get(state, 'menuSettings.createMenu.isForAll'),
  authorityRefs: get(state, 'menuSettings.createMenu.authorities') || []
});

const mapDispatchToProps = dispatch => ({
  setAuthorities: payload => dispatch(setAuthoritiesCreateMenu(payload)),
  setMenuItems: items => dispatch(setCreateMenuItems(items)),
  setLastAddedItems: items => dispatch(setLastAddedCreateItems(items)),
  setIsForAll: payload => dispatch(setIsForAllCreateMenu(payload)),
  addJournalMenuItems: data => dispatch(addJournalMenuItems(data))
});

export default connect(mapStateToProps, mapDispatchToProps)(EditorCreateMenu);
