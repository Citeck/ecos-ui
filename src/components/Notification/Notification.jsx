import React from 'react';
import { connect } from 'react-redux';

import { setNotificationMessage } from '../../actions/notification';

import styles from './Notification.module.scss';

const Notification = ({ text, closeMessage }) => {
  if (!text) {
    return null;
  }

  return (
    <div className={styles.message}>
      {text}
      <span className={styles.close} onClick={closeMessage} />
    </div>
  );
};

export default connect(
  state => ({
    text: state.notification.text
  }),
  (dispatch, ownProps) => ({
    closeMessage: () => dispatch(setNotificationMessage(''))
  })
)(Notification);
