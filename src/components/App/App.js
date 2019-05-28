import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Route, Switch } from 'react-router';
import classNames from 'classnames';

import BPMNDesignerPage from '../../pages/BPMNDesignerPage';
import JournalsPage from '../../pages/JournalsPage';
import JournalsDashboardPage from '../../pages/JournalsDashboardPage';
import CardDetailsPage from '../../pages/CardDetailsPage';
import FormIOPage from '../../pages/FormIOPage';
import EcosFormPage from '../../pages/EcosFormPage';
import Header from '../Header';
import Notification from '../Notification';
import SlideMenu from '../SlideMenu';
import ReduxModal from '../ReduxModal';
import Footer from '../Footer';
import LoginForm from '../LoginForm';

import './App.scss';
import DocPreviewDashlet from '../DocPreview';
import DocPreview from '../DocPreview/DocPreview';

const App = ({ isInit, isInitFailure, isAuthenticated, isMobile, theme }) => {
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
      <SlideMenu />
      <div className="ecos-sticky-wrapper" id="sticky-wrapper">
        <div id="alf-hd">
          <Header />
          <Notification />
        </div>

        <Switch>
          {/*<Route path="/share/page" exact component={DashboardPage} />*/}
          <Route path="/formio-develop" component={FormIOPage} />
          <Route path="/ecos-form-example" component={EcosFormPage} />
          <Route
            path="/doc-preview"
            render={() => (
              <div style={{ display: 'flex', flex: 1 }}>
                <div style={{ width: '857px', margin: '10px' }}>
                  <DocPreviewDashlet
                    id={'dashletId-1-1-2'}
                    config={{
                      link: 'testPdf.pdf',
                      height: 700,
                      scale: 0.5
                    }}
                    classNameDashlet={'classNameDashlet'}
                    classNamePreview={'classNamePreview'}
                  />
                </div>
                <div style={{ width: '50%', margin: '10px' }}>
                  <DocPreviewDashlet id={'dashletId-1-1-2'} config={{ link: 'testImg.jpg', scale: 1, height: 500 }} />
                </div>
                <div style={{ width: '30%', margin: '10px' }}>
                  <DocPreview link={'testImg.jpg'} />
                </div>
              </div>
            )}
          />

          <Route path="/share/page/ui/journals" component={JournalsPage} />
          <Route path="/share/page/journalsDashboard" component={JournalsDashboardPage} />
          <Route path="/share/page/bpmn-designer" component={BPMNDesignerPage} />
          <Route path="/share/page/(.*/)?card-details-new" component={CardDetailsPage} />
          {/*<Route component={NotFoundPage} />*/}
        </Switch>

        <div className="sticky-push" />
      </div>
      <Footer key="card-details-footer" theme={theme} />
    </div>
  );
};

const mapStateToProps = state => ({
  isInit: state.app.isInit,
  isInitFailure: state.app.isInitFailure,
  isMobile: state.view.isMobile,
  theme: state.view.theme,
  isAuthenticated: state.user.isAuthenticated
});

export default withRouter(connect(mapStateToProps)(App));
