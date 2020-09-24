import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { getGroupPriority, setGroupPriority } from '../../actions/menuSettings';
import { t } from '../../helpers/util';
import { treeMoveItem, treeSetDndIndex } from '../../helpers/arrayOfObjects';
import { EcosModal, Loader, Tree } from '../common';
import { Btn } from '../common/btns';

import './style.scss';

const Labels = {
  DESC: 'menu-settings.editor-group-priority.desc',
  BTN_MANAGE: 'menu-settings.editor-group-priority.btn.manage',
  MODAL_TITLE: 'menu-settings.editor-group-priority.title',
  MODAL_BTN_CANCEL: 'menu-settings.editor-group-priority.btn.cancel',
  MODAL_BTN_APPLY: 'menu-settings.editor-group-priority.btn.apply',
  MODAL_BTN_EXPAND_ALL: 'menu-settings.editor-group-priority.btn.expand-all',
  MODAL_BTN_COLLAPSE_ALL: 'menu-settings.editor-group-priority.btn.collapse-all'
};

class EditorGroupPriority extends React.Component {
  state = {
    isOpenAllGroup: false,
    isOpenManager: false,
    updatedList: null
  };

  openManagerPriority = () => {
    this.props.getGroupPriority();
    this.setState({ isOpenManager: true });
  };

  toggleOpenAll = () => {
    this.setState(({ isOpenAllGroup }) => ({ isOpenAllGroup: !isOpenAllGroup }));
  };

  handleDragEnd = (fromId, toId) => {
    const { groupPriority } = this.props;
    const { updatedList } = this.state;
    const sorted = treeMoveItem({ fromId, toId, original: updatedList || groupPriority || [], key: 'dndIdx' });

    this.setState({ updatedList: treeSetDndIndex(sorted, (item, i) => (item.badge = i + 1)) });
  };

  handleCancel = () => {
    this.setState({ isOpenManager: false });
  };

  handleApply = () => {
    const { setGroupPriority } = this.props;
    const { updatedList } = this.state;

    updatedList && setGroupPriority(updatedList);
    this.handleCancel();
  };

  render() {
    const { isOpenManager, isOpenAllGroup, updatedList } = this.state;
    const { groupPriority, isLoadingPriority } = this.props;

    return (
      <>
        <div className="ecos-menu-settings-group-priority__wrapper">
          <div className="ecos-menu-settings__explanation">{t(Labels.DESC)}</div>
          <Btn onClick={this.openManagerPriority}>{t(Labels.BTN_MANAGE)}</Btn>
        </div>
        {isOpenManager && (
          <EcosModal
            isOpen
            className="ecos-menu-settings-group-priority__modal ecos-modal_width-m"
            hideModal={this.handleCancel}
            title={t(Labels.MODAL_TITLE)}
          >
            {isLoadingPriority && <Loader blur className="ecos-menu-settings__loader" />}
            <div className="ecos-menu-settings-group-priority__wrapper">
              <div className="ecos--flex-space" />
              {/*<Btn className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={this.toggleOpenAll}>*/}
              {/*  {t(isOpenAllGroup ? Labels.MODAL_BTN_COLLAPSE_ALL : Labels.MODAL_BTN_EXPAND_ALL)}*/}
              {/*</Btn>*/}
            </div>
            <div className="ecos-menu-settings-group-priority__tree-field">
              <Tree
                data={updatedList || groupPriority}
                prefixClassName="ecos-menu-settings-group-priority"
                openAll={isOpenAllGroup}
                draggable
                moveInParent
                onDragEnd={this.handleDragEnd}
              />
            </div>

            <div className="ecos-menu-settings__buttons">
              <Btn onClick={this.handleCancel}>{t(Labels.MODAL_BTN_CANCEL)}</Btn>
              <Btn onClick={this.handleApply} className="ecos-btn_blue ecos-btn_hover_light-blue">
                {t(Labels.MODAL_BTN_APPLY)}
              </Btn>
            </div>
          </EcosModal>
        )}
      </>
    );
  }
}

const mapStateToProps = state => ({
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
