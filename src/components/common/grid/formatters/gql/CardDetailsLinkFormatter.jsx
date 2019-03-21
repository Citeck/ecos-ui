import React from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class CardDetailsLinkFormatter extends DefaultGqlFormatter {
  render() {
    let props = this.props;
    return <a href={`/share/page/card-details?nodeRef=${props.row.id}`}>{this.value(props.cell)}</a>;
  }
}
