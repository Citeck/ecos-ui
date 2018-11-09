import React from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';
import Header from '../Header';
import Modal from '../Modal';

const App = ({ isMobile }) => (
  <div className={cn({ mobile: isMobile })}>
    <Header />
    <Modal />
  </div>
);

const mapStateToProps = state => ({
  isMobile: state.view.isMobile
});

export default connect(mapStateToProps)(App);
