import React from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';
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
