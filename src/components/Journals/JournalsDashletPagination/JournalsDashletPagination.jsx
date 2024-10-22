import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import isFunction from 'lodash/isFunction';

import { reloadGrid, setGrid } from '../../../actions/journals';
import { wrapArgs } from '../../../helpers/redux';
import Pagination from '../../common/Pagination/Pagination';
import { HEIGHT_GRID_ROW, HEIGHT_GRID_WRAPPER, HEIGHT_THEAD, MIN_CARD_DATA_NEW_JOURNAL, PAGINATION_SIZES } from '../constants';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    viewMode: newState.viewMode,
    grid: newState.grid,
    loading: newState.loading
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    setGridPagination: pagination => dispatch(setGrid(w({ pagination })))
  };
};

class JournalsDashletPagination extends Component {
  static propTypes = {
    className: PropTypes.string,
    grid: PropTypes.object,
    isWidget: PropTypes.bool,
    isViewNewJournal: PropTypes.bool,
    maxHeightJournalData: PropTypes.number,
    reloadGrid: PropTypes.func,
    setGridPagination: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      maxHeightJournalData: null
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { maxHeightJournalData, isViewNewJournal, setGridPagination, isDecrementLastRow } = this.props;

    if ((maxHeightJournalData && !prevState.maxHeightJournalData) || prevProps.isDecrementLastRow !== isDecrementLastRow) {
      this.setState({ maxHeightJournalData });

      if (isViewNewJournal && isFunction(setGridPagination)) {
        let maxItems = Math.floor((maxHeightJournalData - HEIGHT_GRID_WRAPPER - HEIGHT_THEAD) / HEIGHT_GRID_ROW);

        if (isDecrementLastRow) {
          maxItems -= 1;
        }

        if (maxItems < MIN_CARD_DATA_NEW_JOURNAL) {
          maxItems = MIN_CARD_DATA_NEW_JOURNAL;
        }

        setGridPagination({
          skipCount: 0,
          maxItems,
          page: 1
        });
      }
    }
  }

  changePage = pagination => {
    this.reloadGrid(pagination);
  };

  reloadGrid = pagination => {
    this.props.reloadGrid({ pagination });
  };

  render() {
    const { grid, className, ...props } = this.props;
    const { total, pagination = {}, groupBy } = grid || {};

    if (groupBy && groupBy.length) {
      return null;
    }

    return (
      <Pagination
        className={classNames('ecos-journal-dashlet__pagination', className)}
        total={total}
        sizes={PAGINATION_SIZES}
        onChange={this.changePage}
        {...pagination}
        {...props}
      />
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletPagination);
