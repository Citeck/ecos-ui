import React from "react";
import classNames from 'classnames';
import get from 'lodash/get';

import { Btn, IcoBtn } from '../common/btns';
import { EcosModal, Icon, Loader, Pagination } from '../common';
import CreateVariants from "./CreateVariants";
import { getIconUpDown } from '../../helpers/icon';
import { getHtmlIdByUid, beArray, isMobileDevice, t, isNodeRef } from '../../helpers/util';
import { DataTypes, DisplayModes, Labels } from './constants';

import "./ChooseGroupModal.scss";

const ChooseGroupModal = ({ 
  title,
  journalConfig,
  isOpen,
  isFullScreenWidthModal,
  isCreateModalOpen,
  isCollapsePanelOpen,
  hideSelectPanel,
  hideCreateButton,
}) => {
  const hideModal = () => {

  }

  return (
    <EcosModal
      title={title}
      isOpen={isOpen}
      hideModal={hideModal}
      className={classNames('select-journal-select-modal', {
        'ecos-modal_width-lg': !isFullScreenWidthModal,
        'ecos-modal_width-full': isFullScreenWidthModal
      })}
    >
      {!hideSelectPanel && (
        <div className="select-journal-collapse-panel">
          <div className="select-journal-collapse-panel__controls">
            <div className="select-journal-collapse-panel__controls-left">
              {!hideCreateButton && journalConfig && (
                <CreateVariants
                  items={get(journalConfig, 'meta.createVariants')}
                  toggleCreateModal={this.toggleCreateModal}
                  isCreateModalOpen={isCreateModalOpen}
                  onCreateFormSubmit={this.onCreateFormSubmit}
                />
              )}
              <IcoBtn
                invert
                icon={getIconUpDown(isCollapsePanelOpen)}
                className="ecos-btn_drop-down ecos-btn_r_8 ecos-btn_x-step_10 select-journal-collapse-panel__controls-left-btn-filter"
                onClick={this.toggleCollapsePanel}
              >
                {t(Labels.FILTER_BUTTON)}
              </IcoBtn>
            </div>
            <div className="select-journal-collapse-panel__controls-right">
              {!this.isQuery && <Search searchField={searchField} onApply={this.onApplyFilters} />}
            </div>
          </div>

          <Collapse isOpen={isCollapsePanelOpen}>
            {journalConfig.columns && <Filters columns={journalConfig.columns} onApply={this.onApplyFilters} />}
          </Collapse>
        </div>
      )}

      {this.isQuery && (
        <div className="select-journal__info-msg">
          <Icon className="icon-filter" />
          {`${t(Labels.MSG_WHOLE_SELECTION)}. ${t(Labels.SELECTED_LABEL, { data: gridData.total })}`}
        </div>
      )}
      <div id={getHtmlIdByUid(journalId, 'container')} className="select-journal__grid-container">
        {!isGridDataReady && <Loader />}

        <Grid
          {...gridData}
          singleSelectable={!multiple}
          multiSelectable={multiple}
          onSelect={this.onSelectGridItem}
          className={classNames('select-journal__grid', { 'select-journal__grid_transparent': !isGridDataReady })}
          scrollable
          autoHeight
          byContentHeight
          onRowDoubleClick={this.onRowDoubleClick}
          pageId={journalId}
          {...extraProps}
        />
      </div>

      <div className="select-journal-select-modal__buttons">
        <Pagination className="select-journal__pagination" total={gridData.total} {...pagination} onChange={this.onChangePage} />
        <div className="select-journal-select-modal__buttons-space" />
        <Btn className="select-journal-select-modal__buttons-cancel" onClick={this.onCancelSelect}>
          {t(Labels.CANCEL_BUTTON)}
        </Btn>
        <Btn className="ecos-btn_blue select-journal-select-modal__buttons-ok" onClick={this.onSelectFromJournalPopup}>
          {t(Labels.SAVE_BUTTON)}
        </Btn>
      </div>
    </EcosModal>
  )
  
}

export default ChooseGroupModal;
