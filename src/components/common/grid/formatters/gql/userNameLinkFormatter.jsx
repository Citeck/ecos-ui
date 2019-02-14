import React from 'react';
import DefaultGqlFormatter from './defaultGqlFormatter';

export default class UserNameLinkFormatter extends DefaultGqlFormatter {
  static getQueryString(dataField) {
    return `.att(n:"${dataField}"){displayName:str,userName:att(n:"cm:userName"){str}}`;
  }

  value(cell) {
    return cell.displayName || '';
  }

  render() {
    let props = this.props;
    let cell = props.cell || {};
    let userName = cell.userName || '';

    return <a href={`/share/page/user/${userName}/profile`}>{this.value(cell)}</a>;
  }
}
