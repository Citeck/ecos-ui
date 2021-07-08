import React from 'react';
import PropTypes from 'prop-types';
import set from 'lodash/set';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';
import classNames from 'classnames';

import DashboardService from '../../../services/dashboard';
import { t } from '../../../helpers/util';
import { EditTabs, ScrollArrow } from '../../../components/common';
import { IcoBtn } from '../../../components/common/btns';
import { RemoveDialog } from '../../../components/common/dialogs';

import '../style.scss';

const Labels = {
  TITLE: 'dashboard-settings.board-tabs.title',
  DESC: 'dashboard-settings.board-tabs.edit-number-contents',
  REMOVE_TITLE: 'dashboard-settings.remove-tab-dialog.title',
  REMOVE_TEXT: 'dashboard-settings.remove-tab-dialog.text'
};

class SetTabs extends React.Component {
  static propTypes = {
    activeTabKey: PropTypes.string,
    tabs: PropTypes.array,
    setData: PropTypes.func,
    mode: PropTypes.oneOf(['modal', 'page'])
  };

  static defaultProps = {
    activeTabKey: '',
    tabs: []
  };

  state = {
    scrollTabToEnd: false,
    updateScrollPosition: false,
    removedTab: null,
    editableTab: 0
  };

  shouldComponentUpdate(nextProps, nextState) {
    const { tabs, activeTabKey } = this.props;
    const { scrollTabToEnd, updateScrollPosition, removedTab } = this.state;

    return (
      !isEqualWith(tabs, nextProps.tabs, isEqual) ||
      activeTabKey !== nextProps.activeTabKey ||
      scrollTabToEnd !== nextState.scrollTabToEnd ||
      updateScrollPosition !== nextState.updateScrollPosition ||
      removedTab !== nextState.removedTab
    );
  }

  doScrollEnd() {
    this.setState({ scrollTabToEnd: true }, () => {
      this.setState({ scrollTabToEnd: false });
    });
  }

  doScrollCheck() {
    this.setState({ updateScrollPosition: true }, () => {
      this.setState({ updateScrollPosition: false });
    });
  }

  onClickTabLayout = tab => {
    let { activeTabKey, setData } = this.props;

    if (tab.idLayout !== activeTabKey) {
      setData && setData({ activeTabKey: tab.idLayout });
    }
  };

  onCreateTab = () => {
    const { tabs, setData } = this.props;
    const idLayout = DashboardService.newIdLayout;
    const newTab = DashboardService.defaultDashboardTab(idLayout);

    newTab.label = '';
    newTab.isNew = true;

    setData && setData({ tabs: [...tabs, newTab] });
    this.doScrollEnd();
  };

  onEditTab = (tab, index) => {
    const { tabs, setData } = this.props;
    const { label, idLayout } = tab;
    const newTabs = cloneDeep(tabs);

    set(newTabs, [index], { label, idLayout });
    setData && setData({ tabs: newTabs });
  };

  onStartEditTab = (position = 0) => {
    this.setState({ editableTab: position });
  };

  onConfirmDeleteTab = (tab, index) => {
    this.setState({ removedTab: { ...tab, index } });
  };

  onSortTabs = sortedTabs => {
    const { setData } = this.props;

    setData &&
      setData({
        tabs: sortedTabs.map(({ label, idLayout }) => ({ label, idLayout }))
      });
  };

  onDeleteTab = () => {
    const {
      removedTab: { index, idLayout }
    } = this.state;
    let { tabs, activeTabKey, setData } = this.props;
    const newTabs = cloneDeep(tabs);

    newTabs.splice(index, 1);

    if (idLayout === activeTabKey) {
      activeTabKey = get(newTabs, '[0].idLayout', null);
    }

    this.closeDialog();
    setData && setData({ tabs: newTabs, activeTabKey, removedTab: idLayout });
    this.doScrollCheck();
  };

  closeDialog = () => {
    this.setState({ removedTab: null });
  };

  renderArrowTabs() {
    const { tabs, activeTabKey, mode } = this.props;
    const { scrollTabToEnd, editableTab, updateScrollPosition } = this.state;
    const empty = isEmpty(tabs);

    if (empty) {
      return null;
    }

    return (
      <ScrollArrow
        medium
        changeScrollPosition={editableTab !== 0}
        scrollToEnd={scrollTabToEnd}
        updateWhenDataChange={updateScrollPosition}
        className="ecos-dashboard-settings__layout-tabs-arrows"
        selectorToObserve="div.ecos-tabs.ecos-dashboard-settings__layout-tabs-wrap"
      >
        <EditTabs
          className="ecos-dashboard-settings__layout-tabs-wrap"
          classNameTab={classNames('ecos-dashboard-settings__layout-tabs-item', `ecos-dashboard-settings__layout-tabs-item_${mode}`)}
          classNameTooltip="ecos-dashboard-settings__tooltip"
          hasHover
          hasHint
          items={tabs}
          keyField={'idLayout'}
          disabled={tabs.length < 2}
          activeTabKey={activeTabKey}
          onDelete={this.onConfirmDeleteTab}
          onSort={this.onSortTabs}
          onEdit={this.onEditTab}
          onStartEdit={this.onStartEditTab}
          onClick={this.onClickTabLayout}
        />
      </ScrollArrow>
    );
  }

  render() {
    const { tabs } = this.props;
    const { removedTab } = this.state;
    const empty = isEmpty(tabs);

    return (
      <>
        <h6 className="ecos-dashboard-settings__container-subtitle">{t(Labels.DESC)}</h6>
        <div className="ecos-dashboard-settings__layout-tabs-wrapper">
          {this.renderArrowTabs()}
          {empty && <div className="ecos-dashboard-settings__layout-tabs_empty" />}
          <IcoBtn
            icon="icon-small-plus"
            className="ecos-dashboard-settings__layout-tabs-add-tab ecos-btn_i ecos-btn_blue2 ecos-btn_hover_blue2"
            onClick={this.onCreateTab}
          />
        </div>
        <RemoveDialog
          isOpen={!isEmpty(removedTab)}
          title={t(Labels.REMOVE_TITLE)}
          text={t(Labels.REMOVE_TEXT, { name: get(removedTab, 'label', '') })}
          onDelete={this.onDeleteTab}
          onCancel={this.closeDialog}
          onClose={this.closeDialog}
        />
      </>
    );
  }
}

export default SetTabs;
