import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { setCardMode } from '../../../actions/cardDetails';
import { setURLParameter } from '../../../helpers/citeck';

const mapDispatchToProps = (dispatch, ownProps) => ({
  onClick: () => {
    setURLParameter('mode', ownProps.id);
    dispatch(setCardMode(ownProps.id));
  }
});

const CardletsModeTab = ({ isActive, title, onClick }) => (
  <span className={classNames('header-tab', { current: isActive })}>
    {/* eslint-disable-next-line */}
    <a onClick={onClick}>{title}</a>
  </span>
);

export default connect(
  null,
  mapDispatchToProps
)(CardletsModeTab);
