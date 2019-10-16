import React, { Component, Fragment } from 'react';
import queryString from 'query-string';
import isEmpty from 'lodash/isEmpty';
import { withRouter } from 'react-router';
import { trigger, getBool } from '../../helpers/util';
import { changeUrlLink } from '../../components/PageTabs/PageTabs';

class UrlManager extends Component {
  _prevUrlParams = {};

  updateUrl(params, prevUrlParams) {
    const {
      history: {
        location: { pathname, search }
      }
    } = this.props;
    let fromUrlParams = this.setBools(queryString.parse(search));

    if (isEmpty(params)) {
      for (let key in fromUrlParams) {
        const fromUrlValue = fromUrlParams[key];
        const prevUrlValue = prevUrlParams[key];

        if (fromUrlValue !== prevUrlValue) {
          this.triggerParse(fromUrlParams);
          break;
        }
      }
    } else {
      let needUpdate = false;

      for (let key in params) {
        const value = params[key];

        if (value !== fromUrlParams[key]) {
          fromUrlParams[key] = value;
          needUpdate = true;
        }
      }

      if (needUpdate) {
        changeUrlLink(`${pathname}?${queryString.stringify(fromUrlParams)}`);
        this.triggerParse(fromUrlParams);
      }
    }

    return fromUrlParams;
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

  onChildrenRender = () => {
    trigger.call(this, 'onChildrenRender');
  };

  render() {
    const { children, params } = this.props;
    const urlParams = (this._prevUrlParams = this.updateUrl(params, this._prevUrlParams));

    return (
      <Fragment>
        {typeof children.type === 'function' ? React.cloneElement(children, { urlParams, onRender: this.onChildrenRender }) : children}
      </Fragment>
    );
  }
}

export default withRouter(UrlManager);
