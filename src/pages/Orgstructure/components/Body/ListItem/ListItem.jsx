import React, { useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import set from 'lodash/set';
import noop from 'lodash/noop';
import isFunction from 'lodash/isFunction';
import { NotificationManager } from 'react-notifications';

import { OrgstructContext } from '../../../../../components/common/Orgstruct/OrgstructContext';
import { EcosModal } from '../../../../../components/common';
import FormManager from '../../../../../components/EcosForm/FormManager';
import ModalContent from '../ModalContent';
import { setSelectedPerson } from '../../../../../actions/orgstructure';
import { t } from '../../../../../helpers/util';
import { updateCurrentUrl } from '../../../../../helpers/urls';
import { getDashboardConfig } from '../../../../../actions/dashboard';
import GroupIcon from './GroupIcon';
import { SourcesId } from '../../../../../constants';
import defaultAvatar from './Vector.png';

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
  CANCEL: 'orgstructure-delete-modal-cancel',
};

const FORM_CONFIG = {
  AUTHORITY_GROUP: {
    id: 'DEFAULT',
    name: {
      ru: 'Группа',
      en: 'Group',
    },
    sourceId: SourcesId.GROUP,
    typeRef: `${SourcesId.TYPE}@authority-group`,
    formRef: `${SourcesId.FORM}@authority-group-form`,
  },
  PERSON: {
    id: 'DEFAULT',
    name: {
      ru: 'Пользователь',
      en: 'Person',
    },
    sourceId: SourcesId.PERSON,
    typeRef: `${SourcesId.TYPE}@person`,
    formRef: `${SourcesId.FORM}@person-form`,
  },
};

const Avatar = ({ item }) => {
  return <img src={item?.attributes?.photo || defaultAvatar} alt="avatar" className="orgstructure-page__avatar" />;
};

const renderListItem = (item, nestingLevel, isPerson) => {
  if (!item.extraLabel) {
    return <span className="orgstructure-page__list-item-label">{item.label}</span>;
  }

  return (
    <div
      className={classNames('orgstructure-page__list-item-label-with-extra', {
        'orgstructure-page__list-item-label-with-extra_fullwidth': nestingLevel === 0,
      })}
    >
      {isPerson && <Avatar item={item} />}
      <span className="orgstructure-page__list-item-label">{item.label}</span>
      <span className="select-orgstruct__list-item-label-extra">({item.extraLabel})</span>
    </div>
  );
};

const ListItem = ({ item, nestingLevel, nestedList, dispatch, deleteItem, selectedPerson, tabId, toggleToFirstTab, previousParent }) => {
  const { onToggleCollapse, getItemsByParent, setGroupModal, setPersonModal, openedItems } = useContext(OrgstructContext);

  const [hovered, setHovered] = useState(false);
  const [scrollLeft, setScrollLeftPosition] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const selected = selectedPerson === item.id;
  const onClickLabel = () => {
    if (item.hasChildren) {
      onToggleCollapse(item, null, previousParent);
    }
  };
  const onScroll = useCallback(
    (e) => {
      const targetScrollLeft = get(e, 'target.scrollLeft', 0);

      if (scrollLeft !== targetScrollLeft) {
        setScrollLeftPosition(targetScrollLeft);
      }
    },
    [scrollLeft],
  );

  useEffect(() => {
    window.addEventListener('scroll', onScroll, true);

    return () => {
      window.removeEventListener('scroll', onScroll, true);
    };
  });

  const renderCollapseHandler = () => {
    if (item.hasChildren) {
      const isOpen =
        previousParent && openedItems[item.id] && openedItems[item.id].length >= 0
          ? openedItems[item.id].includes(previousParent)
          : item.isOpen;

      const collapseHandlerClassNames = classNames('icon select-orgstruct__collapse-handler', {
        'icon-small-right': !isOpen,
        'icon-small-down': isOpen,
      });

      return <span className={collapseHandlerClassNames} />;
    }
  };

  const handleMouseEnter = (e) => {
    const parent = e.target.closest('.slide-menu-list > div');

    setHovered(true);
    parent && setScrollLeftPosition(parent.scrollLeft);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const createForm =
    (formConfig) =>
    (e, isEditMode = false) => {
      e.stopPropagation();

      const isPerson = formConfig.sourceId === SourcesId.PERSON;
      const extraConfig = {};
      let title;

      set(extraConfig, 'attributes.authorityGroups', [item.id]);

      if (isPerson) {
        extraConfig.recordRef = null;

        title = t(Labels.TITLE_PERSON_CREATE);
      } else {
        title = isEditMode ? t(Labels.TITLE_GROUP_EDIT) : t(Labels.TITLE_SUBGROUP_CREATE);
      }

      if (isEditMode) {
        extraConfig.recordRef = item.id;
      }

      FormManager.createRecordByVariant(
        { ...formConfig, ...extraConfig },
        {
          title,
          onSubmit: () => {
            getItemsByParent(item, isEditMode);
          },
          initiator: {
            type: 'form-component',
            name: 'CreateVariants',
          },
        },
      );
    };

  const createPerson = createForm(FORM_CONFIG.PERSON);
  const createGroup = createForm(FORM_CONFIG.AUTHORITY_GROUP);

  const openModal = (type) => (e) => {
    e.stopPropagation();
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = (e) => {
    e.stopPropagation();
    setModalOpen(false);
  };

  const openPersonModal = openModal('person');

  const deleteFromGroup = async (e) => {
    closeModal(e);

    try {
      await deleteItem({ ...item });
    } catch (e) {
      NotificationManager.error(t('user-profile-widget.error.delete-profile-data'));
    } finally {
      getItemsByParent(item);
    }
  };

  const personConfig = {
    text: t(Labels.CONFIRM_PERSON_DELETE),
    buttons: [
      {
        text: t(Labels.CANCEL),
        className: 'gray',
        handleClick: closeModal,
      },
      {
        text: t(Labels.GROUP_DELETE),
        handleClick: deleteFromGroup,
      },
    ],
  };

  let modalTitle = '';

  if (modalType === 'group') {
    modalTitle = t(Labels.TITLE_GROUP_DELETE);
  }

  if (modalType === 'person') {
    modalTitle = t(Labels.TITLE_PERSON_DELETE);
  }

  const renderModalContent = () => {
    if (modalType === 'person') {
      return <ModalContent config={personConfig} />;
    }

    return null;
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const selectPerson = (e) => {
    e.stopPropagation();
    dispatch(setSelectedPerson({ recordRef: item.id }));
    dispatch(getDashboardConfig({ recordRef: item.id }));
    updateCurrentUrl({ recordRef: item.id });
    isFunction(toggleToFirstTab) && toggleToFirstTab();
  };

  const canEdit = get(item, 'attributes.canEdit', false);
  const isPerson = item.id.includes(SourcesId.PERSON);
  const isGroup = item.id.includes(SourcesId.GROUP);

  return (
    <li>
      <div
        className={classNames('select-orgstruct__list-item', 'orgstructure-page', {
          'select-orgstruct__list-item_strong': item.isStrong,
        })}
        style={{
          paddingLeft: 20 * nestingLevel,
        }}
        onClick={isPerson ? selectPerson : noop}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={classNames('select-orgstruct__list-item-label', 'orgstructure-page', {
            'select-orgstruct__list-item-label_clickable': item.hasChildren,
            'select-orgstruct__list-item-label_margin-left': nestingLevel > 0 && !item.hasChildren,
          })}
          onClick={onClickLabel}
        >
          <div className="orgstructure-page__list-item-container">
            <div>
              {renderCollapseHandler()}
              {renderListItem(item, nestingLevel, isPerson)}
            </div>

            <div
              className={classNames('orgstructure-page__list-item-icons', {
                'orgstructure-page__list-item-icons_hidden': !hovered,
              })}
              style={{ right: 12 - scrollLeft }}
            >
              {canEdit && isPerson && item.parentId && (
                <GroupIcon title={t(Labels.TITLE_PERSON_DELETE)} icon="remove-person" onClick={openPersonModal} />
              )}
              {canEdit && isPerson && (
                <GroupIcon
                  title={t(Labels.TITLE_PERSON_SELECT)}
                  icon="select-person"
                  className={classNames([{ 'icon-user__clicked': selected }])}
                  onClick={selectPerson}
                />
              )}

              {canEdit && isGroup && <GroupIcon title={t(Labels.TITLE_GROUP_EDIT)} icon="edit" onClick={(e) => createGroup(e, true)} />}
              {canEdit && isGroup && (
                <GroupIcon
                  title={t(Labels.TITLE_SUBGROUP_CREATE)}
                  icon="add-group"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onToggleCollapse(item, () => setGroupModal(item));
                  }}
                />
              )}
              {canEdit && isGroup && (
                <GroupIcon
                  title={t(Labels.TITLE_PERSON_ADD)}
                  icon="add-user"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onToggleCollapse(item, () => setPersonModal(item));
                  }}
                />
              )}
              {canEdit && isGroup && <GroupIcon title={t(Labels.TITLE_PERSON_CREATE)} icon="create-user" onClick={createPerson} />}

              <EcosModal
                className="ecos-modal_width-lg ecos-form-modal orgstructure-page-modal"
                isOpen={modalOpen}
                title={modalTitle}
                hideModal={closeModal}
                onClick={handleModalClick}
              >
                {renderModalContent()}
              </EcosModal>
            </div>
          </div>
        </div>
      </div>
      {nestedList}
    </li>
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
    groupSubType: PropTypes.string,
  }),
});

ListItem.propTypes = {
  item: itemPropType,
  nestingLevel: PropTypes.number,
  nestedList: PropTypes.node,
};

const mapStateToProps = (state) => ({
  selectedPerson: get(state, 'orgstructure.id', ''),
});

export default connect(mapStateToProps)(ListItem);
