import React from 'react';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { createProfileUrl } from '../../../../../helpers/urls';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class UserNameLinkFormatter extends DefaultGqlFormatter {
  static getFilterValue(cell) {
    return get(cell, 'displayName');
  }

  static getQueryString(attribute) {
    return `.att(n:"${attribute}"){displayName:disp,nodeRef:str,userName:att(n:"cm:userName"){str}}`;
  }

  render() {
    const { cell = {} } = this.props;

    if (isEmpty(cell)) {
      return null;
    }

    const { userName, displayName } = cell;
    const url = createProfileUrl(userName);

    return (
      <this.PopperWrapper text={this.value(displayName)}>
        <a href={url}>{this.value(displayName)}</a>
      </this.PopperWrapper>
    );
  }
}
