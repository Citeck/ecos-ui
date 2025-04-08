import React, { useEffect, useState, memo } from 'react';

import FormManager from '../../../components/EcosForm/FormManager';
import Records from '../../../components/Records';
import { Icon, Tooltip } from '../../../components/common';
import { useOrgstructContext } from '../../../components/common/Orgstruct/OrgstructContext';
import { isMobileDevice, t } from '../../../helpers/util';

import OrgstructBody from './OrgstructBody';
import OrgstructureSearch from './OrgstructureSearch';

import './style.scss';

const Labels = {
  TITLE: 'orgstructure-page-title',
  ADD_GROUP: 'orgstructure-page-add-group'
};

const rootGroup = 'emodel/authority-group@_orgstruct_home_';
const tooltipId = 'add-group-button';

const Structure = memo(function Structure({ tabId, toggleToFirstTab }) {
  const context = useOrgstructContext();

  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    Records.get(rootGroup)
      .load('permissions._has.Write?bool')
      .then(value => setCanEdit(value));
  });

  const handleClickAddButton = () => {
    FormManager.openFormModal({
      record: 'emodel/authority-group@',
      formId: 'authority-group-form',
      title: t('orgstructure-page-add-group'),
      attributes: {
        authorityGroups: [rootGroup]
      },
      onSubmit: () => {
        context.onUpdateTree();
      }
    });
  };

  return (
    <>
      <div className="orgstructure-page__structure__header">
        <h1>{t(Labels.TITLE)}</h1>
        {canEdit && (
          <Tooltip uncontrolled text={t(Labels.ADD_GROUP)} target={tooltipId} off={isMobileDevice()}>
            <div id={tooltipId} className="orgstructure-page__structure__bnt-create" onClick={handleClickAddButton}>
              <Icon className="icon-plus" />
            </div>
          </Tooltip>
        )}
      </div>
      <OrgstructureSearch />
      <OrgstructBody tabId={tabId} toggleToFirstTab={toggleToFirstTab} />
    </>
  );
}, arePropsEqual);

function arePropsEqual(oldProps, newProps) {
  return oldProps.tabId === newProps.tabId;
}

export default Structure;
