import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import isFunction from 'lodash/isFunction';

import { cancelReloadGrid, reloadGrid, setGrid } from '../../../actions/journals';
import { wrapArgs } from '../../../helpers/redux';
import Pagination from '../../common/Pagination/Pagination';
import {
  HEIGHT_GRID_ROW,
  HEIGHT_GRID_WRAPPER,
  HEIGHT_THEAD,
  MIN_CARD_DATA_NEW_JOURNAL,
  PAGINATION_SIZES,
  MAX_HEIGHT_TOTAL_AMOUNT
} from '../constants';

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
    setGridPagination: pagination => dispatch(setGrid(w({ pagination }))),
    cancelReloadGrid: () => dispatch(cancelReloadGrid(w()))
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
    setGridPagination: PropTypes.func,
    cancelReloadGrid: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      maxHeightJournalData: null,
      maxItems: null
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { maxHeightJournalData, isViewNewJournal, setGridPagination, isDecrementLastRow, grid } = this.props;
    const { maxItems: gridMaxItems } = grid || {};
    const { maxItems: stateMaxItems } = this.state;

    if (
      (maxHeightJournalData && !prevState.maxHeightJournalData) ||
      prevProps.isDecrementLastRow !== isDecrementLastRow ||
      (stateMaxItems && gridMaxItems && stateMaxItems !== gridMaxItems)
    ) {
      this.setState({ maxHeightJournalData });

      if (isViewNewJournal && isFunction(setGridPagination)) {
        const gridMaxHeight = maxHeightJournalData - HEIGHT_GRID_WRAPPER - HEIGHT_THEAD;
        let maxItems = Math.floor(gridMaxHeight / HEIGHT_GRID_ROW);

        if (isDecrementLastRow) {
          if (gridMaxHeight - HEIGHT_GRID_ROW * (maxItems - 1) >= MAX_HEIGHT_TOTAL_AMOUNT) {
            maxItems -= 1;
          } else {
            maxItems -= 2;
          }
        }

        if (maxItems < MIN_CARD_DATA_NEW_JOURNAL) {
          maxItems = MIN_CARD_DATA_NEW_JOURNAL;
        }

        this.setState({ maxItems }, () => {
          setGridPagination({
            skipCount: 0,
            maxItems,
            page: 1
          });
        });
      }
    }
  }

  changePage = pagination => {
    this.reloadGrid(pagination);
  };

  reloadGrid = pagination => {
    this.props.cancelReloadGrid();
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
