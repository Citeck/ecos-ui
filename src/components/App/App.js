import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Route, Switch } from 'react-router';
import classNames from 'classnames';
import moment from 'moment';
import uuid from 'uuidv4';

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
import {
  createCommentRequest,
  deleteComment,
  deleteCommentRequest,
  getComments,
  updateComment,
  updateCommentRequest
} from '../../actions/comments';

import './App.scss';
import { selectAllComments } from '../../selectors/comments';

class App extends Component {
  constructor() {
    super();

    const comments = [
      {
        id: uuid(),
        avatar: '',
        userName: 'Константин Константинопольский',
        text: 'Текст комментария может быть довольно длинным поэтому мы это должны учитывать в разных ситуациях',
        date: moment()
          .subtract({ days: 12, hours: -1 })
          .toDate(),
        canEdit: true,
        canDelete: false
      },
      {
        id: uuid(),
        avatar: '',
        userName: '',
        text: 'Текст комментария может быть довольно длинным поэтому мы это должны учитывать в разных ситуациях',
        date: moment()
          .subtract({ days: 1, hours: -1 })
          .toDate(),
        canEdit: true,
        canDelete: false
      },
      {
        id: uuid(),
        avatar: 'http://swiftmomentum.com/wp-content/uploads/2013/06/staff-avatar-david.png',
        userName: 'Константин Константинопольский',
        text: 'Текст комментария может быть довольно длинным поэтому мы это должны учитывать в разных ситуациях',
        date: moment()
          .subtract({ hours: 5 })
          .toDate(),
        canEdit: true,
        canDelete: true
      },
      {
        id: uuid(),
        avatar: 'http://swiftmomentum.com/wp-content/uploads/2013/06/staff-avatar-david.png',
        userName: 'Константин Константинопольский',
        text: 'Текст комментария может быть довольно длинным поэтому мы это должны учитывать в разных ситуациях',
        date: moment()
          .subtract({ minutes: 40 })
          .toDate(),
        canEdit: false,
        canDelete: false
      },
      {
        id: uuid(),
        avatar: 'http://swiftmomentum.com/wp-content/uploads/2013/06/staff-avatar-david.png',
        userName: 'Константин Константинопольский',
        text: 'Текст комментария может быть довольно длинным поэтому мы это должны учитывать в разных ситуациях',
        date: moment()
          .subtract({ seconds: 35 })
          .toDate(),
        canEdit: true,
        canDelete: true
      },
      {
        id: uuid(),
        avatar: 'http://swiftmomentum.com/wp-content/uploads/2013/06/staff-avatar-david.png',
        userName: 'Константин Константинопольский',
        text: 'Текст комментария может быть довольно длинным поэтому мы это должны учитывать в разных ситуациях',
        date: moment().toDate(),
        canEdit: false,
        canDelete: false
      }
    ];

    comments.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });

    this.state = {
      comments,
      errorMessage: '',
      commentSaveIsLoading: false
    };
  }

  componentDidMount() {
    const { getShowTabsStatus, getTabs, getComments } = this.props;

    getShowTabsStatus();
    getTabs();
    getComments('workspace://SpacesStore/291bd833-6e27-4865-8416-25d584404c3e');
  }

  handleSaveComment = ({ id = null, message = '' } = {}) => {
    if (id) {
      this.props.updateComment({ text: message, id });
    } else {
      this.props.createComment({
        text: message,
        record: 'workspace://SpacesStore/291bd833-6e27-4865-8416-25d584404c3e'
      });
    }
  };

  handleDeleteComment = id => {
    this.props.deleteComment(id);
  };

  renderComments = () => {
    const { commentFetchIsLoading, commentSendingInProcess, comments } = this.props;
    const { errorMessage } = this.state;

    return (
      <Comments
        comments={comments}
        errorMessage={errorMessage}
        onSave={this.handleSaveComment}
        onDelete={this.handleDeleteComment}
        saveIsLoading={commentSendingInProcess}
      />
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
  tabs: state.pageTabs.tabs,
  comments: selectAllComments(state),
  commentFetchIsLoading: state.comments.fetchIsLoading,
  commentSendingInProcess: state.comments.sendingInProcess
});

const mapDispatchToProps = dispatch => ({
  getShowTabsStatus: () => dispatch(getShowTabsStatus()),
  getTabs: () => dispatch(getTabs()),
  setTabs: tabs => dispatch(setTabs(tabs)),
  getComments: id => dispatch(getComments(id)),
  createComment: data => dispatch(createCommentRequest(data)),
  updateComment: data => dispatch(updateCommentRequest(data)),
  deleteComment: id => dispatch(deleteCommentRequest(id))
});

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);
