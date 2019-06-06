import React from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class DocumentLinkFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `.att(n:"${attribute}"){displayName:disp, id}`;
  }

  value(cell) {
    return cell.displayName || '';
  }

  render() {
    let props = this.props;
    let cell = props.cell || {};

    return <a href={`/share/page/card-details?nodeRef=${cell.id}`}>{this.value(cell)}</a>;
  }
}
