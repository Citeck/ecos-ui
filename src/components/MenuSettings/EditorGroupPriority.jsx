import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { t } from '../../helpers/util';
import { treeMoveItem, treeSetDndIndex } from '../../helpers/arrayOfObjects';
import { getGroupPriority, setGroupPriority } from '../../actions/menuSettings';
import { Loader, Tree } from '../common';
import { Labels } from './utils';

import './style.scss';

class EditorGroupPriority extends React.Component {
  componentDidMount() {
    this.props.getGroupPriority();
  }

  handleDragEnd = (fromId, toId) => {
    const { groupPriority, setGroupPriority } = this.props;
    const sorted = treeMoveItem({ fromId, toId, original: groupPriority || [], key: 'dndIdx' });
    const updatedList = treeSetDndIndex(sorted, (item, i) => (item.badge = i + 1));

    setGroupPriority(updatedList);
  };

  render() {
    const { groupPriority, isLoadingPriority, disabledEdit } = this.props;

    return (
      <div className="ecos-menu-settings-group-priority__tree-container">
        {isLoadingPriority && <Loader blur className="ecos-menu-settings__loader" />}
        <div className="ecos-menu-settings__explanation">{t(Labels.DESC)}</div>
        <div className="ecos-menu-settings-group-priority__tree-field">
          <Tree
            data={groupPriority}
            prefixClassName="ecos-menu-settings-group-priority"
            draggable={!disabledEdit}
            moveInParent
            onDragEnd={this.handleDragEnd}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  disabledEdit: get(state, 'menuSettings.disabledEdit'),
  groupPriority: get(state, 'menuSettings.groupPriority', []),
  isLoadingPriority: get(state, 'menuSettings.isLoadingPriority')
});

const mapDispatchToProps = dispatch => ({
  setGroupPriority: items => dispatch(setGroupPriority(items)),
  getGroupPriority: () => dispatch(getGroupPriority())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorGroupPriority);
