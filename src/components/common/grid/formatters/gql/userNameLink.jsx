import React from 'react';
import DefaultGqlFormatter from './defaultGqlFormatter';

export default class UserNameLink extends DefaultGqlFormatter {
  static getQueryString() {
    return 'str, userName: edge(n: "cm:userName"){vals{str}}';
  }

  getUrl(cell) {
    const val = cell.vals || [];
    const userName = val[0] ? (val[0].userName.val[0] ? val[0].userName.val[0].str : null) : null;
    return userName ? `/share/page/user/${userName}/profile` : null;
  }

  render() {
    const url = this.getUrl(this.props.cell || {});

    return <a href={url}>{this.value()}</a>;
  }
}
