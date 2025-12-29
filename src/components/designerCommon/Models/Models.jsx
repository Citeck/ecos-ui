import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import moment from 'moment';
import React from 'react';
import Scrollbars from 'react-custom-scrollbars';
import { Row } from 'reactstrap';

import { Loader, PointsLoader } from '../../common';
import CreateModelCard from '../CreateModelCard';
import ModelCard from '../ModelCard';
import ModelList from '../ModelList';

import { BPMN_MODELS_PAGE_MAX_ITEMS } from '@/constants/bpmn';
import { ViewTypes } from '@/constants/commonDesigner';

const INITIAL_VISIBLE_MODELS = 10;
const MODELS_BATCH_SIZE = 10;

class Models extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      initialized: false,
      cachedModels: null,
      cacheKey: null,
      visibleModelsCount: INITIAL_VISIBLE_MODELS,
      isLoadingMoreModels: false
    };

    this.debouncedLoadFullModels = this.debounce(categoryId => {
      const { getFullModels } = this.props;
      if (isFunction(getFullModels)) {
        getFullModels(categoryId);
      }
    }, 500);
  }

  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  get hasMore() {
    const { modelsInfo } = this.props;
    return modelsInfo.hasMore;
  }

  componentDidMount() {
    const { categoryId, initModels, isCategoryOpen } = this.props;
    const { initialized } = this.state;

    if (isCategoryOpen && !initialized) {
      isFunction(initModels) && initModels(categoryId);
      this.setState({ initialized: true });
    }

    this.checkAndLoadFullModels();
  }

  componentDidUpdate(prevProps) {
    const { categoryId, initModels, isCategoryOpen } = this.props;
    const { initialized } = this.state;

    if (prevProps.isCategoryOpen !== isCategoryOpen && isCategoryOpen && !initialized) {
      isFunction(initModels) && initModels(categoryId);
      this.setState({ initialized: true });
    }

    if (
      prevProps.searchText !== this.props.searchText ||
      get(prevProps, 'modelsInfo.page.maxItems') !== get(this.props, 'modelsInfo.page.maxItems')
    ) {
      this.checkAndLoadFullModels();
    }

    if (prevProps.searchText !== this.props.searchText) {
      this.setState({
        visibleModelsCount: INITIAL_VISIBLE_MODELS,
        isLoadingMoreModels: false
      });
    }
  }

  checkAndLoadFullModels = () => {
    const { searchText, modelsInfo, categoryId } = this.props;
    const { isLoading, page } = modelsInfo || {};

    if (!isLoading && searchText && page && page.maxItems === BPMN_MODELS_PAGE_MAX_ITEMS) {
      this.debouncedLoadFullModels(categoryId);
    }
  };

  handleScrollFrame = (scroll = {}) => {
    const { categoryId, getNextModels, modelsInfo } = this.props;
    const { isLoading, isNextModelsLoading, models = [] } = modelsInfo || {};
    const { visibleModelsCount, isLoadingMoreModels } = this.state;

    const isNearBottom =
      scroll.scrollTop && Math.abs(Number(scroll.scrollTop + scroll.clientHeight).toFixed(2) - Number(scroll.scrollHeight).toFixed(2)) < 10;

    if (isNearBottom && !isLoading && !isNextModelsLoading && !isLoadingMoreModels) {
      // First check if we need to load more visible models from current data
      if (visibleModelsCount < models.length) {
        this.setState({ isLoadingMoreModels: true });
        this.loadMoreModels();
      }
      // Then check if we need to load more data from server
      else if (this.hasMore) {
        isFunction(getNextModels) && getNextModels(categoryId);
      }
    }
  };

  generateCacheKey = () => {
    const { modelsInfo, viewType, canEditDef } = this.props;
    const { models = [] } = modelsInfo || {};
    const { visibleModelsCount } = this.state;

    return `${JSON.stringify(models)}-${viewType}-${canEditDef}-${visibleModelsCount}-${models.map(m => m.id).join(',')}`;
  };

  loadMoreModels = () => {
    const { modelsInfo } = this.props;
    const { models = [] } = modelsInfo || {};
    const { visibleModelsCount } = this.state;

    const newCount = Math.min(visibleModelsCount + MODELS_BATCH_SIZE, models.length);

    if (newCount > visibleModelsCount) {
      this.setState({
        visibleModelsCount: newCount,
        isLoadingMoreModels: false
      });
    }
  };

  renderModels = () => {
    const { modelsInfo, viewType, onViewLinkClick, onEditLinkClick, onDeleteModelClick, onEditMetaClick, canEditDef } = this.props;
    const { models = [] } = modelsInfo || {};
    const { visibleModelsCount } = this.state;

    const ModelComponent = viewType === ViewTypes.LIST ? ModelList : ModelCard;

    const visibleModels = models.slice(0, visibleModelsCount);

    return visibleModels.map(model => (
      <ModelComponent
        canWrite={model.canWrite}
        key={model.id}
        viewLink={`/v2/dashboard?recordRef=${model.id}`}
        onViewLinkClick={onViewLinkClick}
        onEditLinkClick={e => onEditLinkClick(e, model.id)}
        onDeleteModelClick={e => onDeleteModelClick(e, model.id, model)}
        onEditMetaClick={e => onEditMetaClick(e, model.id, model)}
        label={model.label}
        sectionCode={model.sectionCode}
        author={model.creator}
        datetime={moment(model.created).calendar()}
        image={model.previewUrl}
        definition={model.definition}
        canEditDef={canEditDef}
      />
    ));
  };

  getCachedModels = () => {
    const currentCacheKey = this.generateCacheKey();
    const { cachedModels, cacheKey } = this.state;

    if (cacheKey === currentCacheKey && cachedModels) {
      return cachedModels;
    }

    const newCachedModels = this.renderModels();
    this.setState({
      cachedModels: newCachedModels,
      cacheKey: currentCacheKey
    });

    return newCachedModels;
  };

  render() {
    const { categoryId, modelsInfo, searchText, viewType, showModelCreationForm, createModelCardLabel, canCreateDef } = this.props;

    const { isLoading, isNextModelsLoading, models = [] } = modelsInfo || {};
    const { isLoadingMoreModels } = this.state;

    const renderedModels = this.getCachedModels();

    return (
      <div className={`ecos-designer__scroll ecos-designer__scroll-${viewType}`}>
        <Scrollbars
          autoHeight
          autoHeightMin={viewType === ViewTypes.LIST ? 10 : 100}
          autoHeightMax={470}
          onScrollFrame={this.handleScrollFrame}
        >
          {isLoading && <Loader />}
          <Row noGutters>
            {renderedModels}
            {viewType === ViewTypes.CARDS && !isLoading && !models.length && !searchText && canCreateDef && (
              <CreateModelCard showModelCreationForm={showModelCreationForm} label={createModelCardLabel} categoryId={categoryId} />
            )}
          </Row>
        </Scrollbars>
        {(isNextModelsLoading || isLoadingMoreModels) && <PointsLoader className="ecos-designer__loader" />}
      </div>
    );
  }
}

export default React.memo(Models);
