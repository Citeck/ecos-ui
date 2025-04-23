import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import React, { useContext, useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { connect } from 'react-redux';
import { Collapse } from 'reactstrap';

import ModalContent from '../ModalContent';

import CollapseArrow from './CollapseArrow';
import GroupIcon from './GroupIcon';
import InternalList from './InternalList';

import { getDashboardConfig, setLoading } from '@/actions/dashboard';
import { setSelectedPerson } from '@/actions/orgstructure';
import FormManager from '@/components/EcosForm/FormManager';
import Records from '@/components/Records';
import { EcosModal, Loader } from '@/components/common';
import { OrgstructContext } from '@/components/common/Orgstruct/OrgstructContext';
import { ROOT_GROUP_NAME } from '@/components/common/Orgstruct/constants';
import { handleResponse } from '@/components/common/form/SelectOrgstruct/helpers';
import { SourcesId } from '@/constants';
import { updateCurrentUrl } from '@/helpers/urls';
import { t } from '@/helpers/util';
import { NotificationManager } from '@/services/notifications';

import './ListItem.scss';

const Labels = {
  TITLE_PERSON_DELETE: 'orgstructure-delete-modal-title-person',
  TITLE_PERSON_SELECT: 'orgstructure-page-no-picked-person-text',
  TITLE_GROUP_DELETE: 'orgstructure-delete-modal-title-group',
  TITLE_GROUP_EDIT: 'orgstructure-edit-modal-title-group',
  TITLE_PERSON_ADD: 'orgstructure-edit-modal-title-person',
  TITLE_PERSON_CREATE: 'orgstructure-add-modal-title-person',
  TITLE_SUBGROUP_CREATE: 'orgstructure-add-modal-title-group',
  CONFIRM_PERSON_DELETE: 'orgstructure-delete-modal-body-person',
  CONFIRM_GROUP_DELETE: 'orgstructure-delete-modal-body-group',
  FULL_DELETE: 'orgstructure-delete-modal-full-delete',
  GROUP_DELETE: 'orgstructure-delete-modal-group-delete',
  CANCEL: 'orgstructure-delete-modal-cancel'
};

const FORM_CONFIG = {
  AUTHORITY_GROUP: {
    id: 'DEFAULT',
    name: {
      ru: 'Группа',
      en: 'Group'
    },
    sourceId: SourcesId.GROUP,
    typeRef: `${SourcesId.TYPE}@authority-group`,
    formRef: `${SourcesId.FORM}@authority-group-form`
  },
  PERSON: {
    id: 'DEFAULT',
    name: {
      ru: 'Пользователь',
      en: 'Person'
    },
    sourceId: SourcesId.PERSON,
    typeRef: `${SourcesId.TYPE}@person`,
    formRef: `${SourcesId.FORM}@person-form`
  }
};

const ListItem = ({ item, tabId, toggleToFirstTab, dispatch, path, onManualRefresh }) => {
  const {
    onToggleCollapse,
    getItemsByParent,
    setGroupModal,
    setPersonModal,
    excludeAuthoritiesByName,
    excludeAuthoritiesByType,
    isIncludedAdminGroup,
    orgStructApi
  } = useContext(OrgstructContext);

  const [nestingLevel, setNestingLevel] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');

  const [isToggle, setToggle] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [nestedList, setNestedList] = useState([]);
  const [groupId, setGroupId] = useState(null);
  const [listId, setListId] = useState([]);
  const [loadedData, setLoadedData] = useState({});
  const [errorItem, setErrorItem] = useState(null);

  const onClickLabel = useCallback(
    async groupItem => {
      if (!groupItem?.hasChildren && !groupItem?.isLoaded) return;
      setNestingLevel(prev => (expandedId === groupItem.id ? prev - 1 : prev + 1));
      setExpandedId(expandedId === groupItem.id ? null : groupItem.id);
      setGroupId(groupItem.id);
      setToggle(!isToggle);

      if (loadedData[groupItem.id]?.length && nestingLevel >= 1) return;
      try {
        const queryGroups = {
          query: { groupName: groupItem.attributes.shortName },
          excludeAuthoritiesByName,
          excludeAuthoritiesByType,
          isIncludedAdminGroup
        };
        const childrenGroups = await orgStructApi.fetchGroup(queryGroups);
        const result = await handleResponse(childrenGroups);
        const configResult = result.map(item => ({
          ...item,
          parentId: groupItem.id
        }));

        if (!configResult.length) {
          setNestedList([{ id: 'empty', label: t('empty-groups-or-users'), hasChildren: false }]);
          setLoadedData(prev => ({ ...prev, [groupItem.id]: configResult }));
          return;
        }
        setNestedList(configResult);
        setLoadedData(prev => ({ ...prev, [groupItem.id]: configResult }));
      } catch (e) {
        console.log('e: ', e);
      }
    },
    [expandedId, excludeAuthoritiesByName, excludeAuthoritiesByType, isIncludedAdminGroup, loadedData, orgStructApi]
  );

  const refreshCurrentGroup = async groupId => {
    const queryGroups = {
      query: { groupName: ROOT_GROUP_NAME },
      excludeAuthoritiesByName,
      excludeAuthoritiesByType,
      isIncludedAdminGroup
    };

    const childrenGroups = await orgStructApi.fetchGroup(queryGroups);
    const result = await handleResponse(childrenGroups);
    return result.find(item => item.id === groupId);
  };

  const createForm = useCallback(
    formConfig =>
      (e, isEditMode = false) => {
        e.stopPropagation();

        const isPerson = formConfig.sourceId === SourcesId.PERSON;

        const extraConfig = {
          recordRef: isEditMode ? item.id : isPerson ? null : undefined
        };

        const title = isPerson ? t(Labels.TITLE_PERSON_CREATE) : isEditMode ? t(Labels.TITLE_GROUP_EDIT) : t(Labels.TITLE_SUBGROUP_CREATE);

        const onSubmit = async submitedRecord => {
          const newGroups = await Records.get(submitedRecord).load('authorityGroups[]?id');
          const prevGroups = get(item, 'attributes.groups', []);
          const difference = prevGroups.filter(authorityGroup => !newGroups.includes(authorityGroup));
          const groupId = difference[0] || newGroups[1];
          const groupForRefresh = await refreshCurrentGroup(groupId);
          if (groupForRefresh && onManualRefresh) {
            onManualRefresh(groupForRefresh);
          }

          getItemsByParent(
            {
              ...item,
              attributes: { ...item.attributes, groups: newGroups }
            },
            isEditMode,
            difference.includes(`emodel/authority-group@${ROOT_GROUP_NAME}`)
          );
        };

        FormManager.createRecordByVariant(
          { ...formConfig, ...extraConfig },
          {
            title,
            onSubmit,
            initiator: {
              type: 'form-component',
              name: 'CreateVariants'
            }
          }
        );
      },
    []
  );

  const deletePersonItem = useCallback(async item => {
    const record = Records.get(item.id);
    record.att('att_rem_authorityGroups', item.parentId);

    const groupForRefresh = await refreshCurrentGroup(item.parentId);
    if (groupForRefresh && onManualRefresh) {
      onManualRefresh(groupForRefresh);
    }
    return record.save();
  }, []);

  const createPerson = createForm(FORM_CONFIG.PERSON);
  const createGroup = createForm(FORM_CONFIG.AUTHORITY_GROUP);

  const openModal = useCallback(
    type => e => {
      e.stopPropagation();
      setModalType(type);
      setModalOpen(true);
    },
    []
  );

  const closeModal = useCallback(e => {
    e.stopPropagation();
    setModalOpen(false);
  });

  const deleteFromGroup = useCallback(async e => {
    closeModal(e);
    try {
      await deletePersonItem({ ...item });
    } catch (e) {
      NotificationManager.error(t('user-profile-widget.error.delete-profile-data'));
    } finally {
      getItemsByParent(item);
    }
  }, []);

  const personConfig = {
    text: t(Labels.CONFIRM_PERSON_DELETE),
    buttons: [
      {
        text: t(Labels.CANCEL),
        className: 'gray',
        handleClick: closeModal
      },
      {
        text: t(Labels.GROUP_DELETE),
        handleClick: deleteFromGroup
      }
    ]
  };

  const modalTitleMap = {
    group: t(Labels.TITLE_GROUP_DELETE),
    person: t(Labels.TITLE_PERSON_DELETE)
  };

  const modalTitle = modalTitleMap[modalType] || '';

  const renderModalContent = () => (modalType === 'person' ? <ModalContent config={personConfig} /> : null);

  const selectPerson = useCallback(e => {
    e.stopPropagation();

    dispatch(setSelectedPerson({ recordRef: item.id, key: tabId }));
    dispatch(setLoading({ status: true, key: tabId }));
    dispatch(getDashboardConfig({ recordRef: item.id, key: tabId }));

    updateCurrentUrl({ recordRef: item.id });
    isFunction(toggleToFirstTab) && toggleToFirstTab();
  }, []);

  const canEdit = useMemo(() => get(item, 'attributes.canEdit', false), []);
  const isPerson = useMemo(() => item.id.includes(SourcesId.PERSON), []);
  const isGroup = useMemo(() => item.id.includes(SourcesId.GROUP), []);

  const getGroups = useCallback(item => get(item, 'attributes.groups', []), [nestingLevel]);

  return (
    <div>
      <div
        className={classNames('select-orgstruct__list-item', 'orgstructure-page', {
          'select-orgstruct__list-item_strong': item.isStrong
        })}
        onClick={isPerson ? selectPerson : noop}
      >
        <div
          className={classNames('select-orgstruct__list-item-label', 'orgstructure-page', {
            'select-orgstruct__list-item-label_clickable': item.hasChildren,
            'select-orgstruct__list-item-label_margin-left': nestingLevel > 0 && !item.hasChildren
          })}
          onClick={() => onClickLabel(item)}
        >
          <div className="orgstructure-page__list-item-container">
            <div>
              <CollapseArrow isToggle={isToggle} hasChildren={item.hasChildren} />
              <InternalList infoLabel={item} nestingLevel={nestingLevel} isPerson={isPerson} />
            </div>

            <div className={classNames('orgstructure-page__list-item-icons')}>
              {canEdit && isPerson && item.parentId && (
                <GroupIcon title={t(Labels.TITLE_PERSON_DELETE)} icon="remove-person" onClick={openModal('person')} />
              )}
              {canEdit && isPerson && <GroupIcon title={t(Labels.TITLE_PERSON_SELECT)} icon="select-person" onClick={selectPerson} />}

              {canEdit && isGroup && <GroupIcon title={t(Labels.TITLE_GROUP_EDIT)} icon="edit" onClick={e => createGroup(e, true)} />}
              {canEdit && isGroup && (
                <GroupIcon
                  title={t(Labels.TITLE_SUBGROUP_CREATE)}
                  icon="add-group"
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    setGroupModal(item);
                  }}
                />
              )}
              {canEdit && isGroup && (
                <GroupIcon
                  title={t(Labels.TITLE_PERSON_ADD)}
                  icon="add-user"
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    setPersonModal(item);
                  }}
                />
              )}
              {canEdit && isGroup && <GroupIcon title={t(Labels.TITLE_PERSON_CREATE)} icon="create-user" onClick={createPerson} />}

              <EcosModal
                className="ecos-modal_width-lg ecos-form-modal orgstructure-page-modal"
                isOpen={modalOpen}
                title={modalTitle}
                hideModal={closeModal}
                onClick={e => e.stopPropagation()}
              >
                {renderModalContent()}
              </EcosModal>
            </div>
          </div>
        </div>
      </div>
      {expandedId === groupId && (
        <>
          {nestedList.map((childItem, index, originNestedList) => {
            return (
              <div
                key={`${path}/${childItem.id}`}
                style={{
                  paddingLeft: 20 * nestingLevel
                }}
              >
                {childItem.id === 'empty' ? (
                  <div className="select-orgstruct__list-item__empty" key={childItem.id}>
                    {childItem.label}
                  </div>
                ) : (
                  <Suspense fallback={<Loader type="points" />}>
                    <ListItem
                      item={childItem}
                      dispatch={dispatch}
                      tabId={tabId}
                      toggleToFirstTab={toggleToFirstTab}
                      onManualRefresh={onClickLabel}
                    />
                  </Suspense>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export const itemPropType = PropTypes.shape({
  id: PropTypes.string,
  label: PropTypes.string,
  hasChildren: PropTypes.bool,
  isOpen: PropTypes.bool,
  isSelected: PropTypes.bool,
  isStrong: PropTypes.bool,
  parentId: PropTypes.string,
  attributes: PropTypes.shape({
    authorityType: PropTypes.string,
    groupType: PropTypes.string,
    groupSubType: PropTypes.string
  })
});

ListItem.propTypes = {
  key: PropTypes.string,
  tabId: PropTypes.string,
  item: itemPropType,
  nestingLevel: PropTypes.number
};

const mapStateToProps = state => ({
  selectedPerson: get(state, 'orgstructure.id', '')
});

export default connect(mapStateToProps)(React.memo(ListItem));
