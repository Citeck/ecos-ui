import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import Pagination from '../../common/Pagination/Pagination';
import { reloadGrid } from '../../../actions/journals';
import { wrapArgs } from '../../../helpers/redux';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    grid: newState.grid
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    reloadGrid: options => dispatch(reloadGrid(w(options)))
  };
};

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
