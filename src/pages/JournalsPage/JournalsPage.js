import React from 'react';
import { Journals } from '../../components/Journals';
import queryString from 'query-string';

export default class JournalsPage extends React.Component {
  render() {
    const params = queryString.parse(this.props.location.search);
    return <Journals id={params.dashletId} />;
  }
}
