import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import Pagination from '../../common/Pagination/Pagination';
import { reloadGrid, setPage } from '../../../actions/journals';

const mapStateToProps = state => ({
  gridData: state.journals.gridData,
  pagination: state.journals.pagination
});

const mapDispatchToProps = dispatch => ({
  reloadGrid: ({ journalId, pagination, columns, criteria }) => dispatch(reloadGrid({ journalId, pagination, columns, criteria })),
  setPage: page => dispatch(setPage(page))
});

class JournalsDashletPagination extends Component {
  onChangePage = pagination => {
    const props = this.props;

    props.setPage(pagination.page);
    props.reloadGrid({
      pagination: pagination
    });
  };

  render() {
    const props = this.props;

    return <Pagination className={'dashlet__pagination'} total={props.gridData.total} {...props.pagination} onChange={this.onChangePage} />;
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletPagination);
