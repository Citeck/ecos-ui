import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { push } from 'connected-react-router';
import queryString from 'query-string';
import classNames from 'classnames';

const mapDispatchToProps = (dispatch, ownProps) => ({
  onClick: () => {
    const pathName = ownProps.location.pathname;
    const searchParams = queryString.parse(ownProps.location.search);
    const newSearchString = queryString.stringify({ ...searchParams, mode: ownProps.id }, { sort: false });

    dispatch(push(`${pathName}?${newSearchString}`));
  }
});

const CardletsModeTab = ({ isActive, title, onClick }) => (
  <span className={classNames('header-tab', { current: isActive })}>
    {/* eslint-disable-next-line */}
    <a onClick={onClick}>{title}</a>
  </span>
);

export default withRouter(
  connect(
    null,
    mapDispatchToProps
  )(CardletsModeTab)
);
