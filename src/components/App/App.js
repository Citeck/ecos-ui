import React from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';
import CardDetails from '../CardDetails';
import Header from '../Header';
import SlideMenu from '../SlideMenu';
import Modal from '../Modal';

const App = ({ isInit, isInitFailure, isMobile }) => {
  if (!isInit) {
    // TODO Loading component
    return null;
  }

  if (isInitFailure) {
    // TODO Crash app component
    return null;
  }

  return (
    <div className={cn({ mobile: isMobile })}>
      <SlideMenu />
      <Header />
      <CardDetails
        alfescoUrl={window.location.protocol + '//' + window.location.host + '/share/proxy/alfresco/'}
        pageArgs={{
          nodeRef: 'workspace://SpacesStore/074277e0-3cdb-4fa1-af5f-c0659db83662',
          pageid: 'card-details',
          theme: 'citeckTheme',
          aikauVersion: '1.0.63'
        }}
        userName={'admin'}
        nodeBaseInfo={{ modified: '2018-11-07T18:42:48.610+03:00', permissions: { Read: true, Write: true }, pendingUpdate: false }}
      />
      <Modal />
    </div>
  );
};

const mapStateToProps = state => ({
  isInit: state.app.isInit,
  isInitFailure: state.app.isInitFailure,
  isMobile: state.view.isMobile
});

export default connect(mapStateToProps)(App);
