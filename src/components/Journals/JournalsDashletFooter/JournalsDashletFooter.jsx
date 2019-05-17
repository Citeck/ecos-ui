import React, { Component } from 'react';
import JournalsDashletPagination from '../JournalsDashletPagination';

export default class JournalsDashletFooter extends Component {
  render() {
    return (
      <div className={'ecos-journal-dashlet__footer'}>
        <JournalsDashletPagination />
      </div>
    );
  }
}
