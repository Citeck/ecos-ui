import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import queryString from 'query-string';
import { push } from 'connected-react-router';
import { withRouter } from 'react-router';
import { trigger, getBool } from '../../helpers/util';

const mapDispatchToProps = dispatch => ({
  push: url => dispatch(push(url))
});

class UrlManager extends Component {
  constructor(props) {
    super(props);
    this.urlParams = this.setBools(queryString.parse(this.props.history.location.search));
    this.triggerParse(this.urlParams);
  }

  updateUrl(params) {
    const {
      push,
      history: {
        location: { pathname }
      }
    } = this.props;
    let needUpdate = false;

    for (let key in params) {
      const value = params[key];

      if (value !== this.urlParams[key]) {
        this.urlParams[key] = value;
        needUpdate = true;
      }
    }

    if (needUpdate) {
      push(`${pathname}?${queryString.stringify(this.urlParams)}`);
      this.triggerParse(this.urlParams);
    }
  }

  triggerParse = params => {
    trigger.call(this, 'onParse', params);
  };

  setBools = obj => {
    for (let key in obj) {
      const val = obj[key];
      obj[key] = getBool(val);
    }

    return obj;
  };

  render() {
    let { children, params } = this.props;

    if (params) {
      this.updateUrl(params);
    }

    children = typeof children.type === 'function' ? React.cloneElement(children, { urlParams: this.urlParams }) : children;

    return <Fragment>{children}</Fragment>;
  }
}

export default connect(
  null,
  mapDispatchToProps
)(withRouter(UrlManager));
