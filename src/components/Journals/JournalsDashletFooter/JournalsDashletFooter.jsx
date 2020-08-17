import React, { Component } from 'react';
import JournalsDashletPagination from '../JournalsDashletPagination';

export default class JournalsDashletFooter extends Component {
  render() {
    const { stateId, isWidget, forwardRef } = this.props;

    return (
      <div ref={forwardRef} className="ecos-journal-dashlet__footer">
        <JournalsDashletPagination stateId={stateId} hasPageSize isWidget={isWidget} />
      </div>
    );
  }
}
