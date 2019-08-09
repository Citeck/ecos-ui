import React from 'react';
import { isEmpty } from 'lodash';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class UserNameLinkFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `.att(n:"${attribute}"){displayName:str,userName:att(n:"cm:userName"){str}}`;
  }

  render() {
    const { cell = {} } = this.props;

    if (isEmpty(cell)) {
      return null;
    }

    const { userName, displayName } = cell;

    return <a href={`/share/page/user/${userName}/profile`}>{this.value(displayName)}</a>;
  }
}
