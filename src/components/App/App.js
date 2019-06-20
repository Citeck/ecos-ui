import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Route, Switch } from 'react-router';
import classNames from 'classnames';

import BPMNDesignerPage from '../../pages/BPMNDesignerPage';
import CardDetailsPage from '../../pages/CardDetailsPage';
import JournalsPage from '../../pages/JournalsPage';
import DocPreviewPage from '../../pages/debug/DocPreview';
import EcosFormPage from '../../pages/debug/EcosFormPage';
import FormIOPage from '../../pages/debug/FormIOPage';
import JournalsDashboardPage from '../../pages/debug/JournalsDashboardPage';

import Header from '../Header';
import Notification from '../Notification';
import SlideMenu from '../SlideMenu';
import ReduxModal from '../ReduxModal';
import Footer from '../Footer';
import LoginForm from '../LoginForm';
import PageTabs from '../PageTabs';
import Comments from './../Comments';

import { getShowTabsStatus, getTabs, setTabs } from '../../actions/pageTabs';
import { URL } from '../../constants';
import './App.scss';
import moment from 'moment';

class App extends Component {
  state = {
    comments: [
      {
        avatar: '',
        userName: 'Константин Константинопольский',
        comment: 'Текст комментария может быть довольно длинным поэтому мы это должны учитывать в разных ситуациях',
        date: moment()
          .subtract({ days: 12, hours: -1 })
          .toDate()
      },
      {
        avatar: '',
        userName: '',
        comment: 'Текст комментария может быть довольно длинным поэтому мы это должны учитывать в разных ситуациях',
        date: moment()
          .subtract({ days: 1, hours: -1 })
          .toDate()
      },
      {
        avatar: 'http://swiftmomentum.com/wp-content/uploads/2013/06/staff-avatar-david.png',
        userName: 'Константин Константинопольский',
        comment: 'Текст комментария может быть довольно длинным поэтому мы это должны учитывать в разных ситуациях',
        date: moment()
          .subtract({ hours: 5 })
          .toDate()
      },
      {
        avatar: 'http://swiftmomentum.com/wp-content/uploads/2013/06/staff-avatar-david.png',
        userName: 'Константин Константинопольский',
        comment: 'Текст комментария может быть довольно длинным поэтому мы это должны учитывать в разных ситуациях',
        date: moment()
          .subtract({ minutes: 40 })
          .toDate()
      },
      {
        avatar: 'http://swiftmomentum.com/wp-content/uploads/2013/06/staff-avatar-david.png',
        userName: 'Константин Константинопольский',
        comment: 'Текст комментария может быть довольно длинным поэтому мы это должны учитывать в разных ситуациях',
        date: moment()
          .subtract({ seconds: 35 })
          .toDate()
      },
      {
        avatar: 'http://swiftmomentum.com/wp-content/uploads/2013/06/staff-avatar-david.png',
        userName: 'Константин Константинопольский',
        comment: 'Текст комментария может быть довольно длинным поэтому мы это должны учитывать в разных ситуациях',
        date: moment().toDate()
      }
    ],
    errorMessage: '',
    commentSaveIsLoading: false
  };

  componentDidMount() {
    const { getShowTabsStatus, getTabs } = this.props;

    getShowTabsStatus();
    getTabs();
  }

  handleSaveComment = ({ id = null, message = '' } = {}) => {
    this.setState({ commentSaveIsLoading: true }, () => {
      window.setTimeout(() => {
        this.setState({
          errorMessage: 'Ошибка отправки! Попробуйте ещё раз.',
          commentSaveIsLoading: false
        });
      }, 3000);
    });
  };

  renderComments = () => {
    const { comments, errorMessage, commentSaveIsLoading } = this.state;

    return (
      <Comments comments={comments} errorMessage={errorMessage} onSave={this.handleSaveComment} saveIsLoading={commentSaveIsLoading} />
    );
  };

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
        <SlideMenu />
        <div className="ecos-sticky-wrapper" id="sticky-wrapper">
          <div id="alf-hd">
            <Header />
            <Notification />
          </div>

          <PageTabs homepageLink={URL.HOME} isShow={isShow} tabs={tabs} saveTabs={setTabs}>
            <Switch>
              {/*<Route path="/share/page" exact component={DashboardPage} />*/}
              <Route path="/formio-develop" component={FormIOPage} />
              <Route path="/ecos-form-example" component={EcosFormPage} />
              <Route path="/doc-preview" component={DocPreviewPage} />

              <Route path="/share/page/ui/journals" component={JournalsPage} />
              <Route path="/share/page/journalsDashboard" component={JournalsDashboardPage} />
              <Route path="/share/page/bpmn-designer" component={BPMNDesignerPage} />
              <Route path="/share/page/(.*/)?card-details-new" component={CardDetailsPage} />

              <Route path="/comments" component={this.renderComments} />
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
  isInit: state.app.isInit,
  isInitFailure: state.app.isInitFailure,
  isMobile: state.view.isMobile,
  theme: state.view.theme,
  isAuthenticated: state.user.isAuthenticated,
  isShow: state.pageTabs.isShow,
  tabs: state.pageTabs.tabs
});

const mapDispatchToProps = dispatch => ({
  getShowTabsStatus: () => dispatch(getShowTabsStatus()),
  getTabs: () => dispatch(getTabs()),
  setTabs: tabs => dispatch(setTabs(tabs))
});

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);
