import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import Pagination from '../../common/Pagination/Pagination';
import { reloadGrid } from '../../../actions/journals';

const mapStateToProps = state => ({
  grid: state.journals.grid
});

const mapDispatchToProps = dispatch => ({
  reloadGrid: options => dispatch(reloadGrid(options))
});

class JournalsDashletPagination extends Component {
  onChangePage = pagination => this.props.reloadGrid({ pagination });

  render() {
    const {
      grid: { total, pagination, groupBy }
    } = this.props;

    if (groupBy && groupBy.length) {
      return null;
    }

    return <Pagination className={'ecos-journal-dashlet__pagination'} total={total} {...pagination} onChange={this.onChangePage} />;
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletPagination);
