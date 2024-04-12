import React from 'react';

import { useOrgstructContext } from '../../../components/common/Orgstruct/OrgstructContext';
import FormManager from '../../../components/EcosForm/FormManager';
import { isMobileDevice, t } from '../../../helpers/util';
import { Icon, Tooltip } from '../../../components/common';
import OrgstructBody from './OrgstructBody';
import OrgstructureSearch from './OrgstructureSearch';

import './style.scss';

const Labels = {
  TITLE: 'orgstructure-page-title',
  ADD_GROUP: 'orgstructure-page-add-group'
};

const Structure = ({ tabId, toggleToFirstTab }) => {
  const { onUpdateTree } = useOrgstructContext();

  const tooltipId = 'add-group-button';

  const handleClickAddButton = () => {
    FormManager.openFormModal({
      record: 'emodel/authority-group@',
      formId: 'authority-group-form',
      attributes: {
        authorityGroups: ["emodel/authority-group@_orgstruct_home_"],
      },
      onSubmit: () => {
        onUpdateTree();
      }
    });
  };

  return (
    <>
      <div className="orgstructure-page__structure__header">
        <h1>{t(Labels.TITLE)}</h1>
        <Tooltip uncontrolled text={t(Labels.ADD_GROUP)} target={tooltipId} off={isMobileDevice()}>
          <div id={tooltipId} className="orgstructure-page__structure__bnt-create" onClick={handleClickAddButton}>
            <Icon className="icon-plus" />
          </div>
        </Tooltip>
      </div>
      <OrgstructureSearch />
      <OrgstructBody tabId={tabId} toggleToFirstTab={toggleToFirstTab} />
    </>
  );
};

export default Structure;
