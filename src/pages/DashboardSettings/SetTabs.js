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

  onClickTabLayout = tab => {
    let { activeTabKey, setData } = this.props;

    if (tab.idLayout !== activeTabKey) {
      setData(tab.idLayout);
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

  render() {
    const { tabs, activeTabKey } = this.props;
    const { scrollTabToEnd, removedTab } = this.state;
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
                hasHint
                items={tabs}
                keyField={'idLayout'}
                onDelete={this.onConfirmDeleteTab}
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
      </React.Fragment>
    );
  }
}

export default SetTabs;
