import PropTypes from 'prop-types';
import React, { useContext } from 'react';

import { Pagination } from '../../../components/common';
import Orgstruct from '../../../components/common/Orgstruct';
import { OrgstructContext } from '../../../components/common/Orgstruct/OrgstructContext';
import { AUTHORITY_TYPE_GROUP, GroupTypes, PAGINATION_SIZES, AUTHORITY_TYPE_USER } from '../../../components/common/Orgstruct/constants';

import Body from './Body';

import './style.scss';

const OrgstructBody = ({ tabId, toggleToFirstTab }) => {
  const context = useContext(OrgstructContext);

  const {
    pagination,
    onChangePage,
    groupModal,
    setGroupModal,
    personModal,
    setPersonModal,
    orgStructApi,
    onUpdateTree,
    currentTab,
    isSearching,
    tabItems
  } = context;

  return (
    <div className={'orgstructure-page__body__container'}>
      <Body currentTab={currentTab} tabId={tabId} tabItems={tabItems} toggleToFirstTab={toggleToFirstTab} isSearching={isSearching} />

      <Pagination
        page={pagination.page}
        maxItems={pagination.maxItems}
        total={pagination.maxCount}
        hasPageSize
        sizes={PAGINATION_SIZES}
        onChange={onChangePage}
      />

      {(personModal || groupModal) && (
        <Orgstruct
          allowedGroupTypes={groupModal ? [GroupTypes.GROUP] : undefined}
          allowedAuthorityTypes={groupModal ? [AUTHORITY_TYPE_GROUP] : [AUTHORITY_TYPE_USER]}
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
            .map(i => ({ ...i, isSelected: true, isLoaded: true, parentId: undefined }))}
          openByDefault
          parent={groupModal || personModal}
          multiple
        />
      )}
    </div>
  );
};

OrgstructBody.propTypes = {
  setEmployee: PropTypes.func
};

export default React.memo(OrgstructBody);
