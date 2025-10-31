import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

const Footer = React.forwardRef(({ content, forwardedRef }, _ref) => {
  if (isEmpty(content)) {
    return null;
  }

  return <div className="app-footer" ref={forwardedRef} dangerouslySetInnerHTML={{ __html: content }} />;
});

const mapStateToProps = state => ({
  content: get(state, 'app.footer', null)
});

export default withRouter(connect(mapStateToProps, null, null, { forwardRef: true })(Footer));
