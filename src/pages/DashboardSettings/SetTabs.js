import React from 'react';
import PropTypes from 'prop-types';
import set from 'lodash/set';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import DashboardService from '../../services/dashboard';
import { t } from '../../helpers/util';
import { EditTabs, ScrollArrow } from '../../components/common';
import { IcoBtn } from '../../components/common/btns';

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
    scrollTabToEnd: false
  };

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

    newTab.label += ` ${tabs.length + 1}`;
    newTab.isNew = true;

    tabs.push(newTab);

    setData({ tabs });
    this.setState({ scrollTabToEnd: true }, () => {
      this.setState({ scrollTabToEnd: false });
    });
  };

  onEditTab = (tab, index) => {
    const { tabs, setData } = this.props;
    const { label, idLayout } = tab;

    set(tabs, [index], { label, idLayout });

    setData({ tabs });
  };

  onDeleteTab = (tab, index) => {
    let { tabs, activeTabKey, setData } = this.props;

    tabs.splice(index, 1);

    if (tab.idLayout === activeTabKey) {
      activeTabKey = get(tabs, '[0].idLayout', null);
    }

    setData({ tabs, activeTabKey });
  };

  onSortTabs = sortedTabs => {
    let { setData } = this.props;

    setData({
      tabs: sortedTabs.map(({ label, idLayout }) => ({ label, idLayout }))
    });
  };

  render() {
    const { tabs, activeTabKey } = this.props;
    const { scrollTabToEnd } = this.state;
    const empty = isEmpty(tabs);

    return (
      <React.Fragment>
        <h6 className="ecos-dashboard-settings__container-subtitle">{t('dashboard-settings.edit-number-contents')}</h6>
        <div className="ecos-dashboard-settings__layout-tabs-wrapper">
          {!empty && (
            <ScrollArrow scrollToEnd={scrollTabToEnd}>
              <EditTabs
                className="ecos-dashboard-settings__layout-tabs-block"
                classNameTab="ecos-dashboard-settings__layout-tabs-item"
                hasHover
                items={tabs}
                keyField={'idLayout'}
                onDelete={this.onDeleteTab}
                onSort={this.onSortTabs}
                onEdit={this.onEditTab}
                onClick={this.onClickTabLayout}
                disabled={tabs.length < 2}
                activeTabKey={activeTabKey}
              />
            </ScrollArrow>
          )}
          {empty && <div className="ecos-dashboard-settings__layout-tabs_empty" />}
          <IcoBtn
            icon="icon-big-plus"
            className={'ecos-dashboard-settings__layout-tabs__add-tab ecos-btn_i ecos-btn_blue2 ecos-btn_hover_blue2'}
            onClick={this.onCreateTab}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default SetTabs;
