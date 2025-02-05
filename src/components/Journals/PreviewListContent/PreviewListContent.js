import React, { Component } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import classnames from 'classnames';
import moment from 'moment';

import Clock from '../../common/icons/Clock';
import NoData from '../../common/icons/NoData';
import { t } from '../../../helpers/export/util';
import { URL } from '../../../constants';
import { Wall } from '../../common/form';
import { Loader } from '../../common';
import { getLinkWithWs } from '../../../helpers/urls';
import { selectIsViewNewJournal } from '../../../selectors/view';
import { selectPreviewListProps } from '../../../selectors/previewList';
import { PREVIEW_LIST_ASPECT_ATTRIBUTES } from '../../../api/previewList';
import { stripHTML } from '../../../helpers/util';

import './PreviewListContent.scss';

const mapStateToProps = (state, props) => {
  const newState = get(state, ['journals', props.stateId]) || {};

  const isViewNewJournal = selectIsViewNewJournal(state);
  const previewListProps = selectPreviewListProps(state, props.stateId);

  return {
    journalId: get(newState, 'journalConfig.id', ''),
    gridData: get(newState, 'grid.data', []),
    isLoadingJournal: get(newState, 'loading', []),
    isViewNewJournal,
    ...previewListProps
  };
};

class PreviewListContent extends Component {
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return (
      nextProps.isActivePage || !isEqual(nextProps.gridData, this.props.gridData) || !isEqual(nextProps.isLoading, this.props.isLoading)
    );
  }

  getLinkOfId = id => {
    if (!id) {
      return null;
    }

    return getLinkWithWs(URL.DASHBOARD + '?recordRef=' + id);
  };

  renderItemData = (item, idx) => {
    const { previewListConfig } = this.props;
    const { creator, created, id: itemId, previewUrl } = item || {};

    const { id: creatorId, disp: creatorName } = creator || {};
    const formattedDate = moment(created).format('dddd, D MMMM YYYY, H:mm');

    const srcPreviewImg = previewUrl || require('./defaultImage.png');

    const creatorLink = this.getLinkOfId(creatorId);
    const itemLink = this.getLinkOfId(itemId);

    const title = item[previewListConfig[PREVIEW_LIST_ASPECT_ATTRIBUTES.title]] || t('preview-list.no-title');
    const description = item[previewListConfig[PREVIEW_LIST_ASPECT_ATTRIBUTES.description]] || t('preview-list.no-description');

    return (
      <div className="citeck-preview-list-content__card" key={idx}>
        <div className="citeck-preview-list-content__card_img">
          <a href={itemLink} className="citeck-preview-list-content__card-info_title">
            <img className="citeck-preview-list-content__card_img" src={srcPreviewImg} alt={title} />
          </a>
        </div>
        <div className="citeck-preview-list-content__card-info">
          <a href={itemLink} className="citeck-preview-list-content__card-info_title">
            {title}
          </a>
          <p className="citeck-preview-list-content__card-info_description" title={description}>
            {stripHTML(description)}
          </p>
          <div className="citeck-preview-list-content__card-info-author">
            <div className="citeck-preview-list-content__card-info-author person">
              <span className="citeck-preview-list-content__card-info-author_text">{t('preview-list.created-by')}</span>
              <a href={creatorLink} className="citeck-preview-list-content__card-info-author_text link">
                {creatorName}
              </a>
            </div>
            <div className="citeck-preview-list-content__card-info-time">
              <Clock width={8.57} height={8.57} />
              <span className="citeck-preview-list-content__card-info-author_text">{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const {
      maxHeight,
      isViewNewJournal,
      isLoadingPreviewList,
      isLoadingJournal,
      gridData,
      previewListConfig,
      isInitiatedPreviewList = false
    } = this.props;

    const isLoading = isLoadingPreviewList || isLoadingJournal || !isInitiatedPreviewList;
    const isNoData = !isLoading && (!gridData || !gridData.length || !previewListConfig);

    return (
      <Wall
        isViewNewJournal={isViewNewJournal}
        className={classnames('citeck-preview-list-content__list-well citeck-preview-list-content__grid-well_overflow_hidden')}
        maxHeight={maxHeight}
      >
        {isLoading && <Loader />}
        {!isNoData && (gridData || []).map((item, idx) => this.renderItemData(item, idx))}
        {isNoData && (
          <div className="citeck-preview-list-content__no-data">
            <NoData />
            <div className="citeck-preview-list-content__no-data-info">
              <h3 className="citeck-preview-list-content__no-data-info_head">{t('comp.no-data.head')}</h3>
              <span className="citeck-preview-list-content__no-data-info_description">{t('comp.no-data.indication')}</span>
            </div>
          </div>
        )}
      </Wall>
    );
  }
}

export default connect(mapStateToProps)(PreviewListContent);
