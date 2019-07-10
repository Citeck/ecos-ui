import React from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class DocumentLinkFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `.att(n:"${attribute}"){displayName:disp, id}`;
  }

  get isNewVersion() {
    const { pathname } = window.location;

    return pathname.includes('/v2/');
  }

  value(cell) {
    return cell.displayName || '';
  }

  render() {
    let props = this.props;
    let cell = props.cell || {};

    if (this.isNewVersion) {
      return (
        <a target="_blank" href={`/v2/dashboard?recordRef=${cell.id}`}>
          {this.value(cell)}
        </a>
      );
    }

    return <a href={`/share/page/card-details?nodeRef=${cell.id}`}>{this.value(cell)}</a>;
  }
}
