import React, { Component } from 'react';
import queryString from 'query-string';
import isEmpty from 'lodash/isEmpty';
import { withRouter } from 'react-router';

import { deepClone, getBool, trigger } from '../../helpers/util';
import PageService from '../../services/PageService';

class UrlManager extends Component {
  _prevUrlParams = {};

  updateUrl(currentUrlParams, prevUrlParams) {
    const {
      history: {
        location: { pathname, search }
      }
    } = this.props;
    const params = deepClone(currentUrlParams);
    let fromUrlParams = this.setBools(queryString.parse(search));

    Object.keys(params || {}).forEach(key => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

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
        PageService.changeUrlLink(`${pathname}?${queryString.stringify(fromUrlParams)}`, { updateUrl: true });
        this.triggerParse(fromUrlParams);
      }
    }

    return fromUrlParams;
  }

  triggerParse = (params, pathname = window.location.pathname) => {
    this.props.history.push({
      pathname,
      search: queryString.stringify(params)
    });
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
    this._prevUrlParams = this.updateUrl(params, this._prevUrlParams);

    return typeof children.type === 'function'
      ? React.cloneElement(children, {
          urlParams: this._prevUrlParams,
          onRender: this.onChildrenRender,
          setUrl: this.triggerParse
        })
      : children;
  }
}

export default withRouter(UrlManager);
