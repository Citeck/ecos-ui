import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { MenuTypes } from '../../../constants/menu';
import { getAuthorityInfoByRefs, setIsForAll } from '../../../actions/menuSettings';
import { Checkbox, SelectOrgstruct } from '../../common/form';
import { GroupTypes, ViewModes } from '../../common/form/SelectOrgstruct/constants';
import { t } from '../../../helpers/export/util';
import { Labels } from '../utils';
import DialogManager from '../../common/dialogs/Manager';

class EditorOwnership extends React.Component {
  state = {
    redraw: false
  };

  handleToggleForAll = checked => {
    const { isForAll, authorityRefs } = this.props;

    if (checked === isForAll) {
      return;
    }

    if (checked && authorityRefs.length) {
      this.confirmSetForAll(Labels.DIALOG_FOR_ALL_TEXT);
    } else {
      this.props.setIsForAll(checked);
    }
  };

  handleSelectOrg = data => {
    if (!data.length) {
      this.confirmSetForAll(Labels.DIALOG_ORG_STRUCT_TEXT);
    } else {
      this.props.getAuthorityInfoByRefs(data);
    }
  };

  confirmSetForAll(text) {
    DialogManager.confirmDialog({
      title: Labels.DIALOG_FOR_ALL_TITLE,
      text,
      onNo: () => {
        this.props.getAuthorityInfoByRefs(this.props.authorityRefs);
        this.props.setIsForAll(false);
      },
      onYes: () => {
        this.props.getAuthorityInfoByRefs([]);
        this.props.setIsForAll(true);
      }
    });
  }

  render() {
    const { redraw } = this.state;

    if (redraw) {
      return null;
    }

    const { authorityRefs, disabledEdit, isForAll } = this.props;

    return (
      <div className="ecos-menu-settings-ownership">
        <Checkbox checked={isForAll} onClick={this.handleToggleForAll} className="ecos-menu-settings-ownership__field-for-all">
          {t(Labels.FIELD_FOR_ALL_USERS)}
        </Checkbox>
        <SelectOrgstruct
          defaultValue={authorityRefs}
          multiple
          onChange={this.handleSelectOrg}
          isSelectedValueAsText
          viewOnly={disabledEdit}
          viewModeType={ViewModes.LINE_SEPARATED}
          allowedGroupTypes={Object.values(GroupTypes)}
          isIncludedAdminGroup
          disabled={isForAll}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isAdmin: get(state, 'user.isAdmin'),
  isForAll: get(state, 'menuSettings.isForAll'),
  type: get(state, 'menu.type') || MenuTypes.LEFT,
  disabledEdit: get(state, 'menuSettings.disabledEdit'),
  isLoading: get(state, 'menuSettings.isLoading'),
  editedId: get(state, 'menuSettings.editedId'),
  authorityRefs: (get(state, 'menuSettings.authorities') || []).map(item => item.ref || item.name)
});

const mapDispatchToProps = dispatch => ({
  getAuthorityInfoByRefs: payload => dispatch(getAuthorityInfoByRefs(payload)),
  setIsForAll: payload => dispatch(setIsForAll(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorOwnership);
