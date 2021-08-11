import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { reloadGrid } from '../../../actions/journals';
import { wrapArgs } from '../../../helpers/redux';
import Pagination from '../../common/Pagination/Pagination';
import { PAGINATION_SIZES } from '../constants';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    grid: newState.grid,
    loading: newState.loading
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    reloadGrid: options => dispatch(reloadGrid(w(options)))
  };
};

class JournalsDashletPagination extends Component {
  static propTypes = {
    className: PropTypes.string,
    grid: PropTypes.object,
    hasPageSize: PropTypes.bool,
    isWidget: PropTypes.bool,
    reloadGrid: PropTypes.func
  };

  changePage = pagination => {
    this.reloadGrid(pagination);
  };

  reloadGrid = pagination => {
    this.props.reloadGrid({ pagination });
  };

  render() {
    const { grid, hasPageSize, className, loading } = this.props;
    const { total, pagination = {}, groupBy } = grid || {};

    if (groupBy && groupBy.length) {
      return null;
    }

    return (
      <Pagination
        className={classNames('ecos-journal-dashlet__pagination', className)}
        total={total}
        sizes={PAGINATION_SIZES}
        hasPageSize={hasPageSize}
        loading={loading}
        onChange={this.changePage}
        {...pagination}
      />
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletPagination);
