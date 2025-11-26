import classnames from 'classnames';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import moment from 'moment';
import React, { Component } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';

import { Loader, PointsLoader } from '../../common';
import { Well } from '../../common/form';
import Clock from '../../common/icons/Clock';
import NoData from '../../common/icons/NoData';
import DefaultIcon from '../PreviewListContent/DefaultIcon';
import {
  CLASSNAME_PREVIEW_LIST_CARD,
  HEIGHT_HEADER_TILES_PREVIEW_LIST,
  isPreviewList,
  isTable,
  PADDING_WELL_TILES_PREVIEW_LIST,
  SIZE_LISTVIEW_ITEM_TILES
} from '../constants';

import { cancelReloadGrid, fetchBreadcrumbs, getNextPage, reloadGrid } from '@/actions/journals';
import EcosFormUtils from '@/components/EcosForm/EcosFormUtils';
import Breadcrumbs from '@/components/Journals/Breadcrumbs';
import { JournalUrlParams as JUP, URL } from '@/constants';
import { wrapArgs } from '@/helpers/redux';
import { getLinkWithWs, getSearchParams } from '@/helpers/urls';
import { getBool, t } from '@/helpers/util';
import { selectPreviewListProps } from '@/selectors/previewList';
import { selectIsViewNewJournal } from '@/selectors/view';

import './PreviewListContent.scss';

const mapStateToProps = (state, props) => {
  const newState = get(state, ['journals', props.stateId]) || {};

  const isViewNewJournal = selectIsViewNewJournal(state);
  const previewListProps = selectPreviewListProps(state, props.stateId);
  const isTilesContent = getBool(get(previewListProps, 'previewListConfig.isTilesContent', 'false'));
  const showWidgets = getBool(get(getSearchParams(), JUP.VIEW_WIDGET_PREVIEW));

  return {
    journalId: get(newState, 'journalConfig.id', ''),
    gridData: get(newState, 'grid.data', []),
    journalName: get(newState, 'journalConfig.name', ''),
    viewMode: get(newState, 'viewMode'),
    totalCount: get(newState, 'grid.total', 0),
    grid: get(newState, 'grid', {}),
    page: get(newState, 'grid.pagination.page', 1),
    isLoadingGrid: get(newState, 'loadingGrid', false),
    breadcrumbs: get(newState, 'breadcrumbs', []),
    isLoadingJournal: get(newState, 'loading', []),
    searchParams: getSearchParams(),
    isViewNewJournal,
    showWidgets,
    isTilesContent,
    ...previewListProps
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const stateId = props.stateId;
  const w = wrapArgs(stateId);

  return {
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    cancelReloadGrid: () => dispatch(cancelReloadGrid()),
    getNextPage: () => dispatch(getNextPage(w())),
    fetchBreadcrumbs: () => dispatch(fetchBreadcrumbs(w()))
  };
};

class PreviewListContent extends Component {
  refScroll = React.createRef();
  refWell = React.createRef();

  state = {
    isInitiatedPagination: false
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isTilesContent, isLoadingJournal, viewMode, grid } = this.props;
    const { isInitiatedPagination } = this.state;
    const { pagination } = grid || {};

    if (
      get(pagination, 'page') &&
      get(prevProps, 'grid.pagination.page') &&
      pagination.page === 1 &&
      pagination.page !== prevProps.grid.pagination.page &&
      this.refScroll &&
      this.refScroll.current
    ) {
      this.refScroll.current.scrollTop();
    }

    const isSwapPreviewAndTable =
      (isTable(prevProps.viewMode) || isPreviewList(prevProps.viewMode)) &&
      (isTable(viewMode) || isPreviewList(viewMode)) &&
      prevProps.viewMode !== viewMode;

    if ((!isInitiatedPagination || isSwapPreviewAndTable) && isTilesContent && !isLoadingJournal) {
      const wellInstance = this.refWell && this.refWell.current;
      const domNode = wellInstance && wellInstance.getNode();

      if (domNode) {
        const containerWidth = domNode.clientWidth - PADDING_WELL_TILES_PREVIEW_LIST * 2;
        const containerHeight = domNode.clientHeight - PADDING_WELL_TILES_PREVIEW_LIST * 2 - HEIGHT_HEADER_TILES_PREVIEW_LIST;

        const horizontalMaxCardsCount = Math.floor(containerWidth / SIZE_LISTVIEW_ITEM_TILES.SIMPLE.width);
        const verticalMaxCardsCount = Math.floor(containerHeight / SIZE_LISTVIEW_ITEM_TILES.SIMPLE.height);

        const maxItems = horizontalMaxCardsCount * verticalMaxCardsCount + horizontalMaxCardsCount;
        const newPagination = {
          skipCount: 0,
          maxItems,
          page: 1
        };

        if (!isInitiatedPagination) {
          this.setState({ isInitiatedPagination: true });
        }

        if (maxItems) {
          this.changePage(newPagination);
        }
      }
    }
  }

  changePage = pagination => {
    this.props.reloadGrid({ pagination });
  };

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return (
      nextProps.isActivePage || !isEqual(nextProps.gridData, this.props.gridData) || !isEqual(nextProps.isLoading, this.props.isLoading)
    );
  }

  getHeight(changes = 0) {
    return this.props.maxHeight + changes;
  }

  isNoMore = () => {
    const { totalCount, gridData } = this.props;
    return totalCount === 0 || totalCount === gridData.length;
  };

  handleScrollFrame = (scroll = {}) => {
    const { isLoadingJournal, isLoadingGrid } = this.props;

    if (
      !isLoadingJournal &&
      !isLoadingGrid &&
      !this.isNoMore() &&
      scroll.scrollTop &&
      (Math.ceil(scroll.scrollTop + scroll.clientHeight) === scroll.scrollHeight ||
        Math.floor(scroll.scrollTop + scroll.clientHeight) === scroll.scrollHeight)
    ) {
      this.props.getNextPage();
    }
  };

  getLinkOfId = id => {
    if (!id) {
      return null;
    }

    return getLinkWithWs(URL.DASHBOARD + '?recordRef=' + id);
  };

  onItemClick = item => {
    const { onRowClick } = this.props;
    isFunction(onRowClick) && onRowClick(item);
  };

  renderItemData = (item, idx) => {
    const { previewListConfig, selectedRecordId, showWidgets, draggableEvents } = this.props;
    const { creator, created, id: itemId, previewUrl } = item || {};
    const { isDragging, ...dragEvents } = draggableEvents || {};

    const { id: creatorId, disp: creatorName } = creator || {};
    const formattedDate = moment(created).format('dddd, D MMMM YYYY, H:mm');

    const creatorLink = this.getLinkOfId(creatorId);
    const itemLink = this.getLinkOfId(itemId);

    const title = get(item, ['rawAttributes', get(previewListConfig, 'titleListView')]) || t('preview-list.no-title');

    let description = get(item, ['rawAttributes', get(previewListConfig, 'textListView')]) || t('-list.no-description');

    description = EcosFormUtils.stripHTML(description);

    return (
      <div
        {...dragEvents}
        onDragStart={e => dragEvents.onDragStart && dragEvents.onDragStart(e, get(item, 'id', null))}
        onClick={() => this.onItemClick(item)}
        className={classnames(CLASSNAME_PREVIEW_LIST_CARD, {
          cursored: showWidgets,
          selected: selectedRecordId === itemId && showWidgets
        })}
        key={itemId || `card-item-${idx}`}
      >
        <div className="citeck-preview-list-content__card_img">
          {previewUrl ? <img className="citeck-preview-list-content__card_img" src={previewUrl} alt={title} /> : <DefaultIcon />}
        </div>
        <div className="citeck-preview-list-content__card-info">
          <div className="citeck-preview-list-content__card-info-container">
            <a href={itemLink} className="citeck-preview-list-content__card-info_title" title={title}>
              {title}
            </a>
            <p className="citeck-preview-list-content__card-info_description" title={description}>
              {description}
            </p>
          </div>
          <div className="citeck-preview-list-content__card-info-author">
            <div className="citeck-preview-list-content__card-info-author person">
              <span className="citeck-preview-list-content__card-info-author_text">{t('preview-list.created-by')}</span>
              <a href={creatorLink} className="citeck-preview-list-content__card-info-author_text link">
                {creatorName}
              </a>
            </div>
            <div className="citeck-preview-list-content__card-info-time">
              <Clock width={10} height={10} />
              <span className="citeck-preview-list-content__card-info-author_text">{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  renderItems = () => {
    const { gridData, isTilesContent } = this.props;

    const items = (gridData || []).map(this.renderItemData);

    if (isTilesContent) {
      return (
        <Scrollbars
          autoHeight
          autoHeightMin={this.getHeight(-10)}
          autoHeightMax={this.getHeight(-10)}
          renderThumbVertical={props => <div {...props} className="citeck-preview-list-content__scroll_v" />}
          renderTrackHorizontal={props => <div {...props} className="citeck-preview-list-content__scroll_h" />}
          onScrollFrame={this.handleScrollFrame}
          ref={this.refScroll}
        >
          <div className="citeck-preview-list-content__list-well_wrap-list">{items}</div>
        </Scrollbars>
      );
    }

    return items;
  };

  render() {
    const {
      maxHeight,
      isViewNewJournal,
      isLoadingPreviewList,
      isLoadingJournal,
      gridData,
      previewListConfig,
      isTilesContent,
      isLoadingGrid,
      stateId,
      searchParams,
      page
    } = this.props;
    const { isInitiatedPagination } = this.state;

    const journalId = get(searchParams, 'journalId');
    const recordRef = get(searchParams, 'recordRef');

    const isLoading = isLoadingPreviewList || isLoadingJournal || (isTilesContent && !isInitiatedPagination);
    const isNoData = !isLoading && (!gridData || !gridData.length || !previewListConfig);

    return (
      <Well
        ref={this.refWell}
        isViewNewJournal={isViewNewJournal}
        className={classnames('citeck-preview-list-content__list-well citeck-preview-list-content__grid-well_overflow_hidden', {
          'citeck-preview-list-content__list-well_wrap': isTilesContent
        })}
        maxHeight={maxHeight}
      >
        {isLoading && <Loader blur />}
        {journalId && recordRef && <Breadcrumbs stateId={stateId} />}
        {!isNoData && this.renderItems()}

        {isTilesContent && isLoadingGrid && !isLoading && page > 1 && <PointsLoader className="citeck-preview-list-content__loader" />}

        {isNoData && (
          <div className="citeck-preview-list-content__no-data">
            <NoData />
            <div className="citeck-preview-list-content__no-data-info">
              <h3 className="citeck-preview-list-content__no-data-info_head">{t('comp.no-data.head')}</h3>
              <span className="citeck-preview-list-content__no-data-info_description">{t('comp.no-data.indication')}</span>
            </div>
          </div>
        )}
      </Well>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PreviewListContent);
