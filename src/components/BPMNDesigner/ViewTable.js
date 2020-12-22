import React from 'react';
import { connect } from 'react-redux';

const ViewTable = ({ hidden }) => {
  return <div className={hidden ? 'd-none' : ''}>test</div>;
};

const mapDispatchToProps = dispatch => ({});

export default connect(
  null,
  mapDispatchToProps
)(ViewTable);
