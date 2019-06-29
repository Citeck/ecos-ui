import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Route, Switch } from 'react-router';
import classNames from 'classnames';
import get from 'lodash/get';

import BPMNDesignerPage from '../../pages/BPMNDesignerPage';
import CardDetailsPage from '../../pages/CardDetailsPage';
import JournalsPage from '../../pages/JournalsPage';
import DocPreviewPage from '../../pages/debug/DocPreview';
import EcosFormPage from '../../pages/debug/EcosFormPage';
import FormIOPage from '../../pages/debug/FormIOPage';
import JournalsDashboardPage from '../../pages/debug/JournalsDashboardPage';
import DashboardSettingsPage from '../../pages/DashboardSettings';
import DashboardPage from '../../pages/Dashboard';

import Header from '../Header';
import Notification from '../Notification';
import SlideMenu from '../SlideMenu';
import ReduxModal from '../ReduxModal';
import Footer from '../Footer';
import LoginForm from '../LoginForm';
import PageTabs from '../PageTabs';
import TopMenu from '../Layout/TopMenu';

import { getShowTabsStatus, getTabs, setTabs } from '../../actions/pageTabs';
import { initMenuSettings, saveMenuConfig } from '../../actions/menu';
import { MENU_TYPE, URL } from '../../constants';

import './App.scss';

class App extends Component {
  componentDidMount() {
    const { getShowTabsStatus, getTabs, initMenuSettings } = this.props;

    getShowTabsStatus();
    getTabs();
    initMenuSettings();
  }

  handleSaveMenu = links => {
    const { saveMenuConfig, menuType } = this.props;

    saveMenuConfig({
      type: menuType,
      links
    });
  };

  renderMenu() {
    const { menuType, links } = this.props;

    switch (menuType) {
      case MENU_TYPE.LEFT:
        return <SlideMenu />;
      case MENU_TYPE.TOP:
        return <TopMenu isShow={menuType === MENU_TYPE.TOP} isSortable links={links} onSave={this.handleSaveMenu} />;
      default:
        return null;
    }
  }

  render() {
    const { isInit, isInitFailure, isAuthenticated, isMobile, theme, isShow, tabs, setTabs } = this.props;

    if (!isInit) {
      // TODO: Loading component
      return null;
    }

    if (isInitFailure) {
      // TODO: Crash app component
      return null;
    }

    if (!isAuthenticated) {
      return <LoginForm />;
    }

    const appClassNames = classNames('app-container', { mobile: isMobile });

    return (
      <div className={appClassNames}>
        <ReduxModal />

        <div className="ecos-sticky-wrapper" id="sticky-wrapper">
          <div id="alf-hd">
            <Header />
            <Notification />
          </div>

          <PageTabs homepageLink={URL.HOME} isShow={isShow} tabs={tabs} saveTabs={setTabs}>
            {this.renderMenu()}

            <Switch>
              {/*<Route path="/share/page" exact component={DashboardPage} />*/}
              <Route path="/formio-develop" component={FormIOPage} />
              <Route path="/ecos-form-example" component={EcosFormPage} />
              <Route path="/doc-preview" component={DocPreviewPage} />
              <Route path="/share/page/journalsDashboard" component={JournalsDashboardPage} />

              <Route path="/dashboard/settings" component={DashboardSettingsPage} />
              <Route path="/dashboard" exact component={DashboardPage} />

              <Route path="/share/page/bpmn-designer" component={BPMNDesignerPage} />
              <Route path="/share/page/ui/journals" component={JournalsPage} />
              <Route path="/share/page/(.*/)?card-details-new" component={CardDetailsPage} />
              {/*<Route component={NotFoundPage} />*/}
            </Switch>
          </PageTabs>

          <div className="sticky-push" />
        </div>
        <Footer key="card-details-footer" theme={theme} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isInit: get(state, ['app', 'isInit']),
  isInitFailure: get(state, ['app', 'isInitFailure']),
  isMobile: get(state, ['view', 'isMobile']),
  theme: get(state, ['view', 'theme']),
  isAuthenticated: get(state, ['user', 'isAuthenticated']),
  isShow: get(state, ['pageTabs', 'isShow']),
  tabs: get(state, ['pageTabs', 'tabs']),
  menuType: get(state, ['menu', 'type']),
  links: get(state, ['menu', 'links'])
});

const mapDispatchToProps = dispatch => ({
  getShowTabsStatus: () => dispatch(getShowTabsStatus()),
  getTabs: () => dispatch(getTabs()),
  setTabs: tabs => dispatch(setTabs(tabs)),
  initMenuSettings: () => dispatch(initMenuSettings()),
  saveMenuConfig: config => dispatch(saveMenuConfig(config))
});

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);
