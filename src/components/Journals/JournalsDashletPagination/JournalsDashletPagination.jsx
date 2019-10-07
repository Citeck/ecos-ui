import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import Pagination from '../../common/Pagination/Pagination';
import { PAGINATION_SIZES } from '../../Journals/constants';
import { reloadGrid } from '../../../actions/journals';
import { wrapArgs } from '../../../helpers/redux';
import classNames from 'classnames';

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
  changePage = pagination => {
    this.reloadGrid(pagination);
  };

  changeMaxItems = item => {
    this.reloadGrid({ ...this.props.grid.pagination, maxItems: item.value });
  };

  reloadGrid = pagination => {
    this.props.reloadGrid({ pagination });
  };

  render() {
    const {
      grid: { total, pagination, groupBy },
      hasPageSize,
      className
    } = this.props;

    const cssClasses = classNames('ecos-journal-dashlet__pagination', className);

    if (groupBy && groupBy.length) {
      return null;
    }

    return (
      <Pagination
        className={cssClasses}
        total={total}
        {...pagination}
        sizes={PAGINATION_SIZES}
        onChange={this.changePage}
        onChangeMaxItems={this.changeMaxItems}
        hasPageSize={hasPageSize}
      />
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletPagination);
