import React from 'react';

import { useSelectOrgstructContext } from '../../../components/common/form/SelectOrgstruct/SelectOrgstructContext';
import FormManager from '../../../components/EcosForm/FormManager';
import { t } from '../../../helpers/util';
import { Icon } from '../../../components/common';
import OrgstructBody from './OrgstructBody';
import OrgstructureSearch from './OrgstructureSearch';

import './style.scss';

const Labels = {
  TITLE: 'orgstructure-page-title'
};

const Structure = ({ tabId }) => {
  const { onUpdateTree } = useSelectOrgstructContext();

  const handleClickAddButton = () => {
    FormManager.openFormModal({
      record: 'emodel/authority-group@',
      formId: 'authority-group-form',
      onSubmit: () => {
        onUpdateTree();
      }
    });
  };

  return (
    <>
      <div className="orgstructure-page__structure__header">
        <h1>{t(Labels.TITLE)}</h1>
        <div className="orgstructure-page__structure__bnt-create" onClick={handleClickAddButton}>
          <Icon className="icon-plus" />
        </div>
      </div>
      <OrgstructureSearch />
      <OrgstructBody tabId={tabId} />
    </>
  );
};

export default Structure;
