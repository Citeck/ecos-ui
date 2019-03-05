import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import JournalsDashletPagination from '../JournalsDashletPagination';

const mapStateToProps = state => ({});
const mapDispatchToProps = dispatch => ({});

class JournalsDashletFooter extends Component {
  render() {
    return (
      <div className={'journal-dashlet__footer'}>
        <JournalsDashletPagination />
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletFooter);
