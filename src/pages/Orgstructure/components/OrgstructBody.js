import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import { Pagination } from '../../../components/common';
import Orgstruct from '../../../components/common/Orgstruct';
import { AUTHORITY_TYPE_GROUP, GroupTypes, PAGINATION_SIZES, AUTHORITY_TYPE_USER } from '../../../components/common/Orgstruct/constants';

import { useOrgstructContext } from '../../../components/common/Orgstruct/OrgstructContext';

import Body from './Body';

import './style.scss';

const OrgstructBody = ({ reloadList, tabId, toggleToFirstTab }) => {
  const context = useOrgstructContext();

  const {
    toggleSelectModal,
    pagination,
    onChangePage,
    groupModal,
    setGroupModal,
    personModal,
    setPersonModal,
    orgStructApi,
    onUpdateTree,
    currentTab,
    tabItems,
  } = context;

  useEffect(() => {
    toggleSelectModal();
  }, []);

  return (
    <div className={'orgstructure-page__body__container'}>
      <Body reloadList={reloadList} tabId={tabId} toggleToFirstTab={toggleToFirstTab} />

      <Pagination
        page={pagination.page}
        maxItems={pagination.maxItems}
        total={pagination.maxCount}
        hasPageSize
        sizes={PAGINATION_SIZES}
        onChange={onChangePage}
      />

      {(personModal || groupModal) &&
        <Orgstruct
          allowedGroupTypes={groupModal ? [GroupTypes.GROUP]: undefined}
          allowedAuthorityTypes={groupModal ? [AUTHORITY_TYPE_GROUP]: [AUTHORITY_TYPE_USER]}
          onSubmit={(selected, authorityGroups) => {
            orgStructApi.addAuthorityGroups(selected, authorityGroups).then(() => {
              setGroupModal(null);
              setPersonModal(null);
              onUpdateTree();
            });
          }}
          onCancelSelect={() => {
            setGroupModal(null);
            setPersonModal(null);
          }}
          initSelectedRows={tabItems[currentTab]
            .filter(i => i.parentId === (personModal ? personModal.id : groupModal.id))
            .map(i => ({...i, isSelected: true, isLoaded: true, parentId: undefined}))
          }
          openByDefault
          parent={groupModal || personModal}
          multiple
        />
      }
    </div>
  );
};

OrgstructBody.propTypes = {
  setEmployee: PropTypes.func
};

export default OrgstructBody;
