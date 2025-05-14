import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import merge from 'lodash/merge';
import uniqueId from 'lodash/uniqueId';
import React from 'react';
import { connect } from 'react-redux';

import { Tooltip } from '../common';
import { IcoBtn } from '../common/btns';
import PreviewList from '../common/icons/PreviewList';

import { isDocLib, isKanban, isPreview, isPreviewList, isTable, JOURNAL_VIEW_MODE as JVM, Labels } from './constants';

import { toggleViewMode } from '@/actions/journals';
import { JournalUrlParams } from '@/constants';
import { wrapArgs } from '@/helpers/redux';
import { updateCurrentUrl } from '@/helpers/urls';
import { getSearchParams, t } from '@/helpers/util';
import { selectCommonJournalPageProps } from '@/selectors/journals';

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
    toggleViewMode: viewMode => dispatch(toggleViewMode(w({ viewMode, stateId: props.stateId })))
  };
};

const tooltipModifiers = [
  {
    name: 'offset',
    enabled: true,
    options: {
      offset: [10, 5]
    }
  }
];

class ViewTabs extends React.Component {
  targetId = uniqueId('ecos-journal-view-');

  onToggleViewMode = viewMode => {
    const urlViewMode = get(getSearchParams(), JournalUrlParams.VIEW_MODE);
    const urlShowPreview = get(getSearchParams(), JournalUrlParams.SHOW_PREVIEW);
    let newUrl;

    if (urlViewMode !== viewMode) {
      newUrl = merge(newUrl, { viewMode });
    }

    if (!isNil(urlShowPreview) && urlShowPreview !== isPreview(viewMode)) {
      newUrl = merge(newUrl, { showPreview: isPreview(viewMode) });
    }

    if (!isEmpty(newUrl)) {
      updateCurrentUrl(newUrl);
    }

    this.props.toggleViewMode(viewMode);
  };

  render() {
    const { isMobile, isDocLibEnabled, isKanbanEnabled, isPreviewListEnabled, viewMode } = this.props;
    const common = classNames(
      'ecos-journal__view-tabs-btn ecos-journal__view-svg-btn_blue_hover ecos-btn_i ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue',
      { 'ecos-journal__view-tabs_mobile': isMobile }
    );
    const available = 'ecos-btn_blue2 ecos-journal__view-svg-btn_blue_selected ecos-journal__view-tabs-btn_disabled';
    const disable = 'ecos-btn_grey';
    const isPreviewMode = isPreview(viewMode);
    const isTableMode = isTable(viewMode);
    const isDocLibMode = isDocLib(viewMode);
    const isKanbanMode = isKanban(viewMode);
    const isPreviewListMode = isPreviewList(viewMode);
    const target = str => `${this.targetId}-${str}`;

    return (
      <div className="ecos-journal__view-tabs">
        {!isMobile && (
          <>
            <Tooltip off={isMobile} target={target(JVM.TABLE)} text={t(Labels.Views.JOURNAL)} uncontrolled modifiers={tooltipModifiers}>
              <IcoBtn
                id={target(JVM.TABLE)}
                icon="icon-list"
                className={classNames(common, {
                  [available]: isTableMode,
                  [disable]: !isTableMode
                })}
                onClick={() => this.onToggleViewMode(JVM.TABLE)}
              />
            </Tooltip>
            <Tooltip off={isMobile} target={target(JVM.PREVIEW)} text={t(Labels.Views.PREVIEW)} uncontrolled modifiers={tooltipModifiers}>
              <IcoBtn
                id={target(JVM.PREVIEW)}
                icon="icon-columns"
                className={classNames(common, {
                  [available]: isPreviewMode,
                  [disable]: !isPreviewMode
                })}
                onClick={() => this.onToggleViewMode(JVM.PREVIEW)}
              />
            </Tooltip>
          </>
        )}
        {!isMobile && isKanbanEnabled && (
          <Tooltip off={isMobile} target={target(JVM.KANBAN)} text={t(Labels.Views.KANBAN)} uncontrolled modifiers={tooltipModifiers}>
            <IcoBtn
              id={target(JVM.KANBAN)}
              icon="icon-kanban"
              className={classNames(common, 'ecos-journal__view-btn_kanban', {
                [available]: isKanbanMode,
                [disable]: !isKanbanMode
              })}
              onClick={() => this.onToggleViewMode(JVM.KANBAN)}
            />
          </Tooltip>
        )}
        {isDocLibEnabled && (
          <Tooltip off={isMobile} target={target(JVM.DOC_LIB)} text={t(Labels.Views.DOC_LIB)} uncontrolled modifiers={tooltipModifiers}>
            <IcoBtn
              id={target(JVM.DOC_LIB)}
              icon="icon-folder"
              className={classNames(common, {
                [available]: isDocLibMode,
                [disable]: !isDocLibMode
              })}
              onClick={() => this.onToggleViewMode(JVM.DOC_LIB)}
            />
          </Tooltip>
        )}
        {isPreviewListEnabled && (
          <Tooltip
            off={isMobile}
            target={target(JVM.PREVIEW_LIST)}
            text={t(Labels.Views.PREVIEW_LIST)}
            uncontrolled
            modifiers={tooltipModifiers}
          >
            <IcoBtn
              id={target(JVM.PREVIEW_LIST)}
              className={classNames(common, {
                [available]: isPreviewListMode,
                [disable]: !isPreviewListMode
              })}
              onClick={() => this.onToggleViewMode(JVM.PREVIEW_LIST)}
            >
              <PreviewList />
            </IcoBtn>
          </Tooltip>
        )}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewTabs);
