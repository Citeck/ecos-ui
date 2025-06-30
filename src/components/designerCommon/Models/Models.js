import React from 'react';
import Scrollbars from 'react-custom-scrollbars';
import { Row } from 'reactstrap';
import moment from 'moment';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import ModelList from '../ModelList';
import ModelCard from '../ModelCard';
import CreateModelCard from '../CreateModelCard';
import { BPMN_MODELS_PAGE_MAX_ITEMS } from '../../../constants/bpmn';
import { ViewTypes } from '../../../constants/commonDesigner';
import { Loader, PointsLoader } from '../../common';

class Models extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      initialized: false
    };
  }

  get hasMore() {
    const { modelsInfo } = this.props;

    return modelsInfo.hasMore;
  }

  componentDidMount() {
    const { getFullModels, searchText, modelsInfo, categoryId, initModels, isCategoryOpen } = this.props;
    const { page } = modelsInfo || {};
    const { initialized } = this.state;

    if (isCategoryOpen && !initialized) {
      isFunction(initModels) && initModels(categoryId);
      this.setState({ initialized: true });
    }

    if (searchText && page && page.maxItems === BPMN_MODELS_PAGE_MAX_ITEMS) {
      isFunction(getFullModels) && getFullModels(categoryId);
    }
  }

  componentDidUpdate(prevProps) {
    const { getFullModels, categoryId, initModels, modelsInfo, isCategoryOpen, searchText } = this.props;
    const { isLoading, models, page } = modelsInfo || {};
    const { initialized } = this.state;

    if (prevProps.isCategoryOpen !== isCategoryOpen && isCategoryOpen && !initialized) {
      isFunction(initModels) && initModels(categoryId);
      this.setState({ initialized: true });
    }

    if (get(prevProps, 'modelsInfo.models') !== get(this.props, 'modelsInfo.models')) {
      this.setState({ models });
    }

    if (!isLoading && searchText && page && page.maxItems === BPMN_MODELS_PAGE_MAX_ITEMS) {
      isFunction(getFullModels) && getFullModels(categoryId);
    }
  }

  handleScrollFrame = (scroll = {}) => {
    const { categoryId, getNextModels, modelsInfo } = this.props;
    const { isLoading, isNextModelsLoading } = modelsInfo || {};

    if (
      !isLoading &&
      !isNextModelsLoading &&
      this.hasMore &&
      scroll.scrollTop &&
      Math.abs(Number(scroll.scrollTop + scroll.clientHeight).toFixed(2) - Number(scroll.scrollHeight).toFixed(2)) < 10
    ) {
      isFunction(getNextModels) && getNextModels(categoryId);
    }
  };

  render() {
    const { models = [] } = this.state;
    const {
      categoryId,
      modelsInfo,
      searchText,
      viewType,
      onViewLinkClick,
      onEditLinkClick,
      onDeleteModelClick,
      onEditMetaClick,
      showModelCreationForm,
      createModelCardLabel,
      canEditDef,
      canCreateDef
    } = this.props;

    const ModelComponent = viewType === ViewTypes.LIST ? ModelList : ModelCard;
    const { isLoading, isNextModelsLoading } = modelsInfo || {};

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
            {models.map(model => (
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
            ))}
            {viewType === ViewTypes.CARDS && !isLoading && !models.length && !searchText && canCreateDef && (
              <CreateModelCard showModelCreationForm={showModelCreationForm} label={createModelCardLabel} categoryId={categoryId} />
            )}
          </Row>
        </Scrollbars>
        {isNextModelsLoading && <PointsLoader className="ecos-designer__loader" />}
      </div>
    );
  }
}

export default Models;
