import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { t } from '../../../../helpers/util';
import { Search, Tooltip } from '../../../common';
import { IcoBtn, TwoIcoBtn } from '../../../common/btns';
import DialogManager from '../../../common/dialogs/Manager/DialogManager';
import { Dropdown } from '../../../common/form';
import ViewTabs from '../../ViewTabs';
import DocLibPagination from '../DocLibPagination';
import DocLibService from '../DocLibService';

import './DocLibSettingsBar.scss';

const DocLibSettingsBar = ({ stateId, searchText, createVariants, createNode, isMobile, startSearch, onRefresh }) => {
  const grey = 'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const step = classNames('ecos-doclib__settings-bar_step', { 'ecos-doclib__settings-bar_step-mobile': isMobile });

  const openCreateForm = async createVariant => {
    const formDefinition = await DocLibService.getCreateFormDefinition(createVariant);

    DialogManager.showFormDialog({
      title: t('document-library.create-node.title', { name: createVariant.name }),
      formDefinition,
      formData: {
        ...(createVariant.attributes || {})
      },
      onSubmit: submission => {
        createNode({ createVariant, submission: submission.data });
      }
    });
  };

  const renderCreateMenu = () => {
    if (!createVariants || !createVariants.length) {
      return null;
    }

    if (createVariants.length === 1) {
      return (
        <Tooltip off={isMobile} target="ecos-doclib-settings-bar-create" text={t('journals.bar.btn.create')} uncontrolled>
          <IcoBtn
            id="ecos-doclib-settings-bar-create"
            icon={'icon-small-plus'}
            className={`ecos-doclib__add-record ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ${step}`}
            onClick={() => openCreateForm(createVariants[0])}
          />
        </Tooltip>
      );
    }

    return (
      <Dropdown
        hasEmpty
        isButton
        className={step}
        source={createVariants}
        keyFields="key"
        valueField="key"
        titleField="name"
        onChange={openCreateForm}
      >
        <TwoIcoBtn
          icons={['icon-small-plus', 'icon-small-down']}
          className="ecos-doclib__add-record ecos-btn_settings-down ecos-btn_white ecos-btn_hover_blue2"
          title={t('journals.create-record-btn')}
        />
      </Dropdown>
    );
  };

  return (
    <div className={classNames('ecos-doclib__settings-bar', { 'ecos-doclib__settings-bar_mobile': isMobile })}>
      {renderCreateMenu()}

      <Search
        onSearch={startSearch}
        className={`ecos-doclib__settings-bar-search ${step}`}
        collapsed={isMobile}
        text={searchText}
        cleaner
      />

      <Tooltip off={isMobile} target="ecos-doclib-settings-bar-update" text={t('journals.bar.btn.update')} uncontrolled>
        <IcoBtn
          id="ecos-doclib-settings-bar-update"
          icon={'icon-reload'}
          className={classNames('ecos-doclib__settings-bar-update', step, {
            [grey]: !isMobile,
            'ecos-btn_i ecos-btn_white': isMobile
          })}
          onClick={onRefresh}
        />
      </Tooltip>

      <div className="ecos-doclib__settings-bar_right">
        <DocLibPagination stateId={stateId} isMobile={isMobile} className={step} />
        <ViewTabs stateId={stateId} />
      </div>
    </div>
  );
};

DocLibSettingsBar.propTypes = {
  stateId: PropTypes.string,
  searchText: PropTypes.string,
  createVariants: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      typeRef: PropTypes.string,
      formRef: PropTypes.string,
      attributes: PropTypes.objectOf(PropTypes.string),
      key: PropTypes.string
    })
  ),
  createNode: PropTypes.func,
  onToggleViewMode: PropTypes.func,
  isMobile: PropTypes.bool,
  onRefresh: PropTypes.func,
  startSearch: PropTypes.func
};

export default DocLibSettingsBar;
