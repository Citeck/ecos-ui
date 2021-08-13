import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import merge from 'lodash/merge';
import isEmpty from 'lodash/isEmpty';

import { toggleViewMode } from '../../actions/journals';
import { selectCommonJournalPageProps } from '../../selectors/journals';
import { getSearchParams, isExistValue, t } from '../../helpers/util';
import { wrapArgs } from '../../helpers/redux';
import { IcoBtn } from '../common/btns';
import { isDocLib, isPreview, isTable, JOURNAL_VIEW_MODE as JVM } from './constants';
import { updateCurrentUrl } from '../../helpers/urls';
import { JournalUrlParams } from '../../constants';

const mapStateToProps = (state, props) => {
  const commonProps = selectCommonJournalPageProps(state, props.stateId);

  return {
    isMobile: get(state, 'view.isMobile'),
    _url: window.location.href,
    ...commonProps
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    toggleViewMode: viewMode => dispatch(toggleViewMode(w({ viewMode })))
  };
};

const Labels = {
  BTN_JOURNAL: 'journal.title',
  BTN_PREVIEW: 'doc-preview.preview',
  BTN_DOCLIB: 'document-library.title'
};

class ViewTabs extends React.Component {
  onToggleViewMode = viewMode => {
    const urlViewMode = get(getSearchParams(), JournalUrlParams.VIEW_MODE);
    const urlShowPreview = get(getSearchParams(), JournalUrlParams.SHOW_PREVIEW);
    let newUrl;

    if (urlViewMode !== viewMode) {
      newUrl = merge(newUrl, { viewMode });
    }

    if (isExistValue(urlShowPreview) && urlShowPreview !== isPreview(viewMode)) {
      newUrl = merge(newUrl, { showPreview: isPreview(viewMode) });
    }

    if (!isEmpty(newUrl)) {
      updateCurrentUrl(newUrl);
    }

    this.props.toggleViewMode(viewMode);
  };

  render() {
    const { isMobile, isDocLibEnabled, viewMode } = this.props;
    const common = classNames(
      'ecos-journal__view-tabs-btn ecos-btn_i ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue',
      { 'ecos-journal__view-tabs_mobile': isMobile }
    );
    const available = 'ecos-btn_blue2 ecos-journal__view-tabs-btn_disabled';
    const disable = 'ecos-btn_grey';
    const isPreviewMode = isPreview(viewMode);
    const isTableMode = isTable(viewMode);
    const isDocLibMode = isDocLib(viewMode);

    return (
      <div className="ecos-journal__view-tabs">
        {!isMobile && (
          <>
            <IcoBtn
              title={t(Labels.BTN_JOURNAL)}
              icon="icon-list"
              className={classNames(common, {
                [available]: isTableMode,
                [disable]: !isTableMode
              })}
              onClick={() => this.onToggleViewMode(JVM.TABLE)}
            />
            <IcoBtn
              title={t(Labels.BTN_PREVIEW)}
              icon="icon-columns"
              className={classNames(common, {
                [available]: isPreviewMode,
                [disable]: !isPreviewMode
              })}
              onClick={() => this.onToggleViewMode(JVM.PREVIEW)}
            />
          </>
        )}
        {isDocLibEnabled && (
          <IcoBtn
            title={t(Labels.BTN_DOCLIB)}
            icon="icon-folder"
            className={classNames(common, {
              [available]: isDocLibMode,
              [disable]: !isDocLibMode
            })}
            onClick={() => this.onToggleViewMode(JVM.DOC_LIB)}
          />
        )}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ViewTabs);