import React, { Component } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import classnames from 'classnames';
import moment from 'moment';

import Clock from '../../common/icons/Clock';
import { t } from '../../../helpers/export/util';
import { URL } from '../../../constants';
import { Wall } from '../../common/form';
import { Loader } from '../../common';
import { getLinkWithWs } from '../../../helpers/urls';
import { selectIsViewNewJournal } from '../../../selectors/view';
import { selectPreviewListProps } from '../../../selectors/previewList';
import { PREVIEW_LIST_ASPECT_ATTRIBUTES } from '../../../api/previewList';

import './PreviewListContent.scss';
import { stripHTML } from '../../../helpers/util';

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
  state = {};

  constructor(props) {
    super(props);

    this.state = {
      recordId: props.gridData.length === 1 ? props.gridData[0].id : ''
    };
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return (
      nextProps.isActivePage || !isEqual(nextProps.gridData, this.props.gridData) || !isEqual(nextProps.isLoading, this.props.isLoading)
    );
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { journalId, gridData } = this.props;
    const { recordId } = this.state;

    if (gridData.length === 1 && prevState.recordId !== gridData[0].id) {
      this.setState({ recordId: gridData[0].id });
    } else if (prevProps.journalId !== journalId && recordId) {
      this.setState({ recordId: '' });
    }
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

    const title = item[previewListConfig[PREVIEW_LIST_ASPECT_ATTRIBUTES.title]] || t('preview-list.no-title');
    const description = item[previewListConfig[PREVIEW_LIST_ASPECT_ATTRIBUTES.description]] || t('preview-list.no-description');

    return (
      <div className="citeck-preview-list-content__card" key={idx}>
        <div className="citeck-preview-list-content__card_img">
          <img className="citeck-preview-list-content__card_img" src={previewUrl || require('./defaultImage.png')} alt={title} />
        </div>
        <div className="citeck-preview-list-content__card-info">
          <a href={this.getLinkOfId(itemId)} className="citeck-preview-list-content__card-info_title">
            {title}
          </a>
          <p className="citeck-preview-list-content__card-info_description" title={description}>
            {stripHTML(description)}
          </p>
          <div className="citeck-preview-list-content__card-info-author">
            <div className="citeck-preview-list-content__card-info-author person">
              <span className="citeck-preview-list-content__card-info-author_text">{t('preview-list.created-by')}</span>
              <a href={this.getLinkOfId(creatorId)} className="citeck-preview-list-content__card-info-author_text link">
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
    const { maxHeight, isViewNewJournal, isLoadingPreviewList, isLoadingJournal, gridData, previewListConfig } = this.props;

    if (!previewListConfig || isEmpty(previewListConfig)) {
      return null;
    }

    const isLoading = isLoadingPreviewList || isLoadingJournal;

    return (
      <Wall
        isViewNewJournal={isViewNewJournal}
        className={classnames('citeck-preview-list-content__list-well citeck-preview-list-content__grid-well_overflow_hidden')}
        maxHeight={maxHeight}
      >
        {isLoading && <Loader />}
        {!isLoading && (gridData || []).map((item, idx) => this.renderItemData(item, idx))}
      </Wall>
    );
  }
}

export default connect(mapStateToProps)(PreviewListContent);
