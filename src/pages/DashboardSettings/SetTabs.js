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

import './style.scss';

class SetTabs extends React.Component {
  static propTypes = {
    activeLayoutId: PropTypes.string,
    tabs: PropTypes.array,
    setData: PropTypes.func
  };

  static defaultProps = {
    activeLayoutId: '',
    tabs: [],
    setData: () => {}
  };

  state = {
    scrollTabToEnd: false
  };

  onClickTabLayout = tab => {
    let { activeLayoutId, setData } = this.props;

    if (tab.idLayout !== activeLayoutId) {
      setData({ activeLayoutId: tab.idLayout });
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

    debounce(() => {
      this.setState({ scrollTabToEnd: true }, () => {
        this.setState({ scrollTabToEnd: false });
      });
    }, 50)();
  };

  onEditTab = (tab, index) => {
    const { tabs, setData } = this.props;
    const { label, idLayout } = tab;

    set(tabs, [index], { label, idLayout });

    setData({ tabs });
  };

  onDeleteTab = (tab, index) => {
    let { tabs, activeLayoutId, setData } = this.props;

    tabs.splice(index, 1);

    if (tab.idLayout === activeLayoutId) {
      activeLayoutId = get(tabs, '[0].idLayout', null);
    }

    setData({ tabs, activeLayoutId });
  };

  onSortTabs = sortedTabs => {
    let { setData } = this.props;

    setData({
      tabs: sortedTabs.map(({ label, idLayout }) => ({ label, idLayout }))
    });
  };

  render() {
    const { tabs, activeLayoutId } = this.props;
    const { scrollTabToEnd } = this.state;
    const empty = isEmpty(tabs);

    return (
      <React.Fragment>
        <h6 className="ecos-dashboard-settings__container-subtitle">{t('dashboard-settings.edit-number-contents')}</h6>
        <div className="ecos-dashboard-settings__tabs-wrapper">
          {!empty && (
            <ScrollArrow scrollToEnd={scrollTabToEnd}>
              <EditTabs
                className="ecos-dashboard-settings__tabs-block"
                classNameTab="ecos-dashboard-settings__tabs-item"
                hasHover
                hasHint
                items={tabs}
                keyField={'idLayout'}
                onDelete={this.onDeleteTab}
                onSort={this.onSortTabs}
                onEdit={this.onEditTab}
                onClick={this.onClickTabLayout}
                disabled={tabs.length < 2}
                activeTabKey={activeLayoutId}
              />
            </ScrollArrow>
          )}
          {empty && <div className="ecos-dashboard-settings__tabs_empty" />}
          <IcoBtn
            icon="icon-big-plus"
            className={'ecos-dashboard-settings__tabs__add-tab ecos-btn_i ecos-btn_blue2 ecos-btn_hover_blue2'}
            onClick={this.onCreateTab}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default SetTabs;
