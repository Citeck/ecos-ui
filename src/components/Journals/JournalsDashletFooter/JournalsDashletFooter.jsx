import React, { Component } from 'react';
import JournalsPagination from '../JournalsPagination';

export default class JournalsDashletFooter extends Component {
  render() {
    return (
      <div className="ecos-journal-dashlet__footer">
        <JournalsPagination stateId={this.props.stateId} hasPageSize />
      </div>
    );
  }
}
