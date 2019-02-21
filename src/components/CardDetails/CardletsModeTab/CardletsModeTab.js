import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { push } from 'connected-react-router';
import queryString from 'query-string';

function CardletsModeTab(props) {
  let className = 'header-tab';

  if (props.isActive) {
    className += ' current';
  }

  return (
    <span className={className}>
      {/* eslint-disable-next-line */}
      <a onClick={props.onClick}>{props.title}</a>
    </span>
  );
}

export default withRouter(
  connect(
    (state, ownProps) => ownProps,
    (dispatch, ownProps) => {
      return {
        onClick: () => {
          const pathName = ownProps.location.pathname;
          const searchParams = queryString.parse(ownProps.location.search);
          const newSearchString = queryString.stringify({ ...searchParams, mode: ownProps.id }, { sort: false });

          dispatch(push(`${pathName}?${newSearchString}`));
        }
      };
    }
  )(CardletsModeTab)
);
