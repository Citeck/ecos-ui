import React from 'react';
import PropTypes from 'prop-types';
import set from 'lodash/set';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';
import DashboardService from '../../services/dashboard';
import { t } from '../../helpers/util';
import { EditTabs, ScrollArrow } from '../../components/common';
import { IcoBtn } from '../../components/common/btns';
import { RemoveDialog } from '../../components/common/dialogs';

import './style.scss';

class SetTabs extends React.Component {
  static propTypes = {
    activeTabKey: PropTypes.string,
    tabs: PropTypes.array,
    setData: PropTypes.func
  };

  static defaultProps = {
    activeTabKey: '',
    tabs: [],
    setData: () => {}
  };

  state = {
    scrollTabToEnd: false,
    removedTab: null
  };

  wrapperTabsRef = React.createRef();

  doScrollEnd(time = 0) {
    debounce(() => {
      this.setState({ scrollTabToEnd: true }, () => {
        this.setState({ scrollTabToEnd: false });
      });
    }, time)();
  }

  onClickTabLayout = tab => {
    let { activeTabKey, setData } = this.props;

    if (tab.idLayout !== activeTabKey) {
      setData({ activeTabKey: tab.idLayout });
    }
  };

  onCreateTab = () => {
    const { tabs, setData } = this.props;
    const idLayout = DashboardService.newIdLayout;
    const newTab = DashboardService.defaultDashboardTab(idLayout);

    newTab.label = '';
    newTab.isNew = true;

    tabs.push(newTab);
    setData({ tabs });
    this.doScrollEnd();
  };

  onEditTab = (tab, index) => {
    const { tabs, setData } = this.props;
    const { label, idLayout } = tab;

    set(tabs, [index], { label, idLayout });
    setData({ tabs });
  };

  onConfirmDeleteTab = (tab, index) => {
    this.setState({ removedTab: { ...tab, index } });
  };

  onSortTabs = sortedTabs => {
    const { setData } = this.props;

    setData({
      tabs: sortedTabs.map(({ label, idLayout }) => ({ label, idLayout }))
    });
  };

  onDeleteTab = () => {
    const {
      removedTab: { index, idLayout }
    } = this.state;
    let { tabs, activeTabKey, setData } = this.props;

    tabs.splice(index, 1);

    if (idLayout === activeTabKey) {
      activeTabKey = get(tabs, '[0].idLayout', null);
    }

    this.closeDialog();
    setData({ tabs, activeTabKey });
  };

  closeDialog = () => {
    this.setState({ removedTab: null });
  };

  onResizeTabs = w => {
    const wTabs = get(this.wrapperTabsRef, 'current.clientWidth');

    if (wTabs && wTabs < w) {
      this.doScrollEnd(300);
    }
  };

  render() {
    const { tabs, activeTabKey } = this.props;
    const { scrollTabToEnd, removedTab } = this.state;
    const empty = isEmpty(tabs);

    return (
      <>
        <h6 className="ecos-dashboard-settings__container-subtitle">{t('dashboard-settings.edit-number-contents')}</h6>
        <div className="ecos-dashboard-settings__layout-tabs-wrapper">
          {!empty && (
            <ScrollArrow
              medium
              scrollToEnd={scrollTabToEnd}
              className="ecos-dashboard-settings__layout-tabs-arrows"
              innerRef={this.wrapperTabsRef}
            >
              <EditTabs
                classNameTab="ecos-dashboard-settings__layout-tabs-item"
                hasHover
                hasHint
                items={tabs}
                keyField={'idLayout'}
                disabled={tabs.length < 2}
                activeTabKey={activeTabKey}
                onDelete={this.onConfirmDeleteTab}
                onSort={this.onSortTabs}
                onEdit={this.onEditTab}
                onClick={this.onClickTabLayout}
                onResize={this.onResizeTabs}
              />
            </ScrollArrow>
          )}
          {empty && <div className="ecos-dashboard-settings__layout-tabs_empty" />}
          <IcoBtn
            icon="icon-big-plus"
            className={'ecos-dashboard-settings__layout-tabs-add-tab ecos-btn_i ecos-btn_blue2 ecos-btn_hover_blue2'}
            onClick={this.onCreateTab}
          />
        </div>
        <RemoveDialog
          isOpen={!isEmpty(removedTab)}
          title={t('dashboard-settings.remove-tab-dialog.title')}
          text={
            <>
              <div>{`${t('dashboard-settings.remove-tab-dialog.text1')} "${get(removedTab, 'label', '')}"?`}</div>
              <div>{`${t('dashboard-settings.remove-tab-dialog.text2')}`}</div>
            </>
          }
          onDelete={this.onDeleteTab}
          onCancel={this.closeDialog}
          onClose={this.closeDialog}
        />
      </>
    );
  }
}

export default SetTabs;
