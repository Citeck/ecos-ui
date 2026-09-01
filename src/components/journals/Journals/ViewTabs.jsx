import { JournalUrlParams } from '@citeck/constants';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import uniqueId from 'lodash/uniqueId';
import React from 'react';
import { connect } from 'react-redux';

import { isDocLib, isHierarchy, isKanban, isKanbanOrDocLib, isPreviewList, isTable, JOURNAL_VIEW_MODE as JVM, Labels } from './constants';

import { toggleViewMode } from '@/actions/journals';
import { Tooltip } from '@/components/common';
import { IcoBtn } from '@/components/common/btns';
import Folder from '@/components/common/icons/Folder';
import HierarchyTree from '@/components/common/icons/HierarchyTree';
import Kanban from '@/components/common/icons/Kanban';
import List from '@/components/common/icons/List';
import PreviewList from '@/components/common/icons/PreviewList';
import WidgetsPreview from '@/components/common/icons/WidgetsPreview';
import { wrapArgs } from '@/helpers/redux';
import { updateCurrentUrl } from '@/helpers/urls';
import { getBool, getSearchParams, t } from '@/helpers/util';
import { selectCommonJournalPageProps, selectWidgetsConfig } from '@/selectors/journals';
import './ViewTabs.scss';

/**
 * The optical box every view-mode icon is drawn into (COREDEV-349).
 *
 * Every icon in the bar is an inline SVG sharing this box, so the whole row is laid out and
 * rasterized identically — the box height fills the same rows in every button, and each drawing
 * keeps its own natural width inside the box, on integer viewBox units. The bar deliberately uses
 * no `citeck` font glyphs: a glyph's ink sits on fractional pixels of its em box and the browser
 * snaps text to whole-pixel positions, so a glyph could never share pixel rows with the SVGs —
 * `icon-list`, `icon-kanban` and `icon-folder` are all replaced by `common/icons` components.
 */
export const VIEW_TAB_ICON_BOX = { width: 20, height: 18 };

const mapStateToProps = (state, props) => {
  const commonProps = selectCommonJournalPageProps(state, props.stateId);
  const widgetsConfig = selectWidgetsConfig(state, props.stateId);

  return {
    isMobile: get(state, 'view.isMobile'),
    _url: window.location.href,
    widgetsConfig,
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
  state = {
    isViewWidgetsPreview: getBool(get(getSearchParams(), JournalUrlParams.VIEW_WIDGET_PREVIEW, false))
  };

  onToggleViewMode = viewMode => {
    const urlViewMode = get(getSearchParams(), JournalUrlParams.VIEW_MODE);
    let newUrl = {};

    if (urlViewMode !== viewMode) {
      newUrl = { viewMode };
    }

    if (!isEmpty(newUrl)) {
      updateCurrentUrl(newUrl);
    }

    this.props.toggleViewMode(viewMode);
  };

  onToggleViewWidgets = viewWidgets => {
    this.setState({ isViewWidgetsPreview: viewWidgets }, () => updateCurrentUrl({ viewWidgets }));
  };

  render() {
    const { isMobile, isDocLibEnabled, isKanbanEnabled, isHierarchyEnabled, isPreviewListEnabled, viewMode, widgetsConfig } = this.props;
    const { isLeftPositionWidgets } = widgetsConfig || {};

    const { isViewWidgetsPreview } = this.state;
    const common = classNames(
      'ecos-journal__view-tabs-btn ecos-journal__view-svg-btn_blue_hover ecos-btn_i ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue',
      { 'ecos-journal__view-tabs_mobile': isMobile }
    );
    const available = 'ecos-btn_blue2 ecos-journal__view-svg-btn_blue_selected ecos-journal__view-tabs-btn_disabled';
    const disable = 'ecos-btn_grey';
    const isTableMode = isTable(viewMode);
    const isDocLibMode = isDocLib(viewMode);
    const isKanbanMode = isKanban(viewMode);
    const isHierarchyMode = isHierarchy(viewMode);
    const isPreviewListMode = isPreviewList(viewMode);
    const target = str => `${this.targetId}-${str}`;

    return (
      <div className="ecos-journal__view-tabs">
        {(!isMobile || isDocLibEnabled || isPreviewListEnabled) && (
          <Tooltip off={isMobile} target={target(JVM.TABLE)} text={t(Labels.Views.JOURNAL)} uncontrolled modifiers={tooltipModifiers}>
            <IcoBtn
              id={target(JVM.TABLE)}
              className={classNames(common, {
                [available]: isTableMode,
                [disable]: !isTableMode
              })}
              onClick={() => this.onToggleViewMode(JVM.TABLE)}
            >
              <List {...VIEW_TAB_ICON_BOX} />
            </IcoBtn>
          </Tooltip>
        )}
        {!isMobile && isKanbanEnabled && (
          <Tooltip off={isMobile} target={target(JVM.KANBAN)} text={t(Labels.Views.KANBAN)} uncontrolled modifiers={tooltipModifiers}>
            <IcoBtn
              id={target(JVM.KANBAN)}
              className={classNames(common, 'ecos-journal__view-btn_kanban', {
                [available]: isKanbanMode,
                [disable]: !isKanbanMode
              })}
              onClick={() => this.onToggleViewMode(JVM.KANBAN)}
            >
              <Kanban {...VIEW_TAB_ICON_BOX} />
            </IcoBtn>
          </Tooltip>
        )}
        {isHierarchyEnabled && (
          <Tooltip off={isMobile} target={target(JVM.HIERARCHY)} text={t(Labels.Views.HIERARCHY)} uncontrolled modifiers={tooltipModifiers}>
            <IcoBtn
              id={target(JVM.HIERARCHY)}
              className={classNames(common, {
                [available]: isHierarchyMode,
                [disable]: !isHierarchyMode
              })}
              onClick={() => this.onToggleViewMode(JVM.HIERARCHY)}
            >
              <HierarchyTree {...VIEW_TAB_ICON_BOX} />
            </IcoBtn>
          </Tooltip>
        )}
        {isDocLibEnabled && (
          <Tooltip off={isMobile} target={target(JVM.DOC_LIB)} text={t(Labels.Views.DOC_LIB)} uncontrolled modifiers={tooltipModifiers}>
            <IcoBtn
              id={target(JVM.DOC_LIB)}
              className={classNames(common, {
                [available]: isDocLibMode,
                [disable]: !isDocLibMode
              })}
              onClick={() => this.onToggleViewMode(JVM.DOC_LIB)}
            >
              <Folder {...VIEW_TAB_ICON_BOX} />
            </IcoBtn>
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
              <PreviewList {...VIEW_TAB_ICON_BOX} />
            </IcoBtn>
          </Tooltip>
        )}
        {!isKanbanOrDocLib(viewMode) && !isMobile && (
          <Tooltip
            off={isMobile}
            target={target(JVM.WIDGETS)}
            text={t(Labels.Views.WIDGETS_SETTINGS)}
            uncontrolled
            modifiers={tooltipModifiers}
          >
            <IcoBtn
              id={target(JVM.WIDGETS)}
              className={classNames(common, 'with-vertical-line', {
                'ecos-btn_blue2 ecos-journal__view-svg-btn_blue_selected': isViewWidgetsPreview
              })}
              onClick={() => this.onToggleViewWidgets(!isViewWidgetsPreview)}
            >
              <WidgetsPreview {...VIEW_TAB_ICON_BOX} isLeft={isLeftPositionWidgets} />
            </IcoBtn>
          </Tooltip>
        )}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewTabs);
