import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import Pagination from '../../common/Pagination/Pagination';
import {
  HEIGHT_GRID_ROW,
  HEIGHT_GRID_WRAPPER,
  HEIGHT_THEAD,
  MIN_CARD_DATA_NEW_JOURNAL,
  PAGINATION_SIZES,
  MAX_HEIGHT_TOTAL_AMOUNT,
  HEIGHT_LIST_VIEW_ITEM,
  PADDING_LIST_VIEW,
  LIST_VIEW_ITEM_GAP,
  isPreviewList,
  isTable
} from '../constants';

import { cancelReloadGrid, reloadGrid, setGrid } from '@/actions/journals';
import { wrapArgs } from '@/helpers/redux';
import { getSearchParams } from '@/helpers/urls';
import { getBool } from '@/helpers/util';
import { selectPreviewListProps } from '@/selectors/previewList';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  const previewListProps = selectPreviewListProps(state, props.stateId);
  const isTilesContent = getBool(get(previewListProps, 'previewListConfig.isTilesContent', 'false'));

  return {
    viewMode: getSearchParams().viewMode || newState.viewMode,
    grid: newState.grid,
    loading: newState.loading,
    previewListProps: {
      ...previewListProps,
      isTilesContent
    }
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
      updatedPaginationOfNewJournal: false,
      maxItems: null
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { previewListProps, maxHeightJournalData, isViewNewJournal, setGridPagination, isDecrementLastRow, grid, viewMode, loading } =
      this.props;
    const { isTilesContent } = previewListProps || {};
    const { maxItems: gridMaxItems } = grid || {};
    const { maxItems: stateMaxItems } = this.state;

    if ((isTilesContent && isPreviewList(viewMode)) || (isPreviewList(viewMode) && loading)) {
      return;
    }

    const MAX_HEIGHT_ROW = isPreviewList(viewMode) ? HEIGHT_LIST_VIEW_ITEM : HEIGHT_GRID_ROW;

    const isSwapPreviewAndTable =
      (isTable(prevProps.viewMode) || isPreviewList(prevProps.viewMode)) &&
      (isTable(viewMode) || isPreviewList(viewMode)) &&
      prevProps.viewMode !== viewMode;

    if (
      (maxHeightJournalData && !prevState.maxHeightJournalData) ||
      prevProps.isDecrementLastRow !== isDecrementLastRow ||
      isSwapPreviewAndTable ||
      (stateMaxItems && gridMaxItems && stateMaxItems !== gridMaxItems)
    ) {
      this.setState({ maxHeightJournalData });

      if (isViewNewJournal && isFunction(setGridPagination)) {
        const gridMaxHeight = isPreviewList(viewMode)
          ? maxHeightJournalData - PADDING_LIST_VIEW * 2 + LIST_VIEW_ITEM_GAP // LIST_VIEW_ITEM_GAP - there is no "gap" property after the last element.
          : maxHeightJournalData - HEIGHT_GRID_WRAPPER - HEIGHT_THEAD;
        let maxItems = Math.floor(gridMaxHeight / MAX_HEIGHT_ROW);

        if (!isPreviewList(viewMode)) {
          if (isDecrementLastRow) {
            if (gridMaxHeight - MAX_HEIGHT_ROW * (maxItems - 1) >= MAX_HEIGHT_TOTAL_AMOUNT) {
              maxItems -= 1;
            } else {
              maxItems -= 2;
            }
          }

          if (maxItems < MIN_CARD_DATA_NEW_JOURNAL) {
            maxItems = MIN_CARD_DATA_NEW_JOURNAL;
          }
        }

        const pagination = {
          skipCount: 0,
          maxItems,
          page: 1
        };

        this.setState({ updatedPaginationOfNewJournal: true });
        this.setState({ maxItems }, () => {
          setGridPagination(pagination);

          if (isSwapPreviewAndTable) {
            this.changePage(pagination);
          }
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
    const { updatedPaginationOfNewJournal } = this.state;
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
        updatedPaginationOfNewJournal={updatedPaginationOfNewJournal}
        {...pagination}
        {...props}
      />
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(JournalsDashletPagination);
