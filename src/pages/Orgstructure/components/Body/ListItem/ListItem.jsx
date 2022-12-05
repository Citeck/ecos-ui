import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import set from 'lodash/set';
import noop from 'lodash/noop';

import { SelectOrgstructContext } from '../../../../../components/common/form/SelectOrgstruct/SelectOrgstructContext';
import { EcosModal } from '../../../../../components/common';
import FormManager from '../../../../../components/EcosForm/FormManager';
import ModalContent from '../ModalContent';
import { setSelectedPerson } from '../../../../../actions/orgstructure';
import { t } from '../../../../../helpers/util';
import { updateCurrentUrl } from '../../../../../helpers/urls';
import { getDashboardConfig } from '../../../../../actions/dashboard';
import GroupIcon from './GroupIcon';
import { SourcesId } from '../../../../../constants';

import './ListItem.scss';

const Labels = {
  TITLE_PERSON_DELETE: 'orgstructure-delete-modal-title-person',
  TITLE_PERSON_SELECT: 'orgstructure-page-no-picked-person-text',
  TITLE_GROUP_DELETE: 'orgstructure-delete-modal-title-group',
  TITLE_GROUP_EDIT: 'orgstructure-edit-modal-title-group',
  TITLE_PERSON_ADD: 'orgstructure-edit-modal-title-person',
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

const renderListItem = (item, nestingLevel) => {
  if (item.extraLabel) {
    const levelClass = nestingLevel === 0 ? 'orgstructure-page__list-item-label-with-extra__fullwidth' : '';
    return (
      <div className={`orgstructure-page__list-item-label-with-extra ${levelClass}`}>
        <span className="orgstructure-page__list-item-label">{item.label}</span>
        <span className="select-orgstruct__list-item-label-extra">({item.extraLabel})</span>
      </div>
    );
  }

  return <span className="orgstructure-page__list-item-label">{item.label}</span>;
};

const ListItem = ({ item, nestingLevel, nestedList, dispatch, deleteItem, selectedPerson, tabId }) => {
  const { onToggleCollapse, initList } = useContext(SelectOrgstructContext);

  const [hovered, setHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const selected = selectedPerson === item.id;
  const onClickLabel = () => {
    if (item.hasChildren) {
      onToggleCollapse(item);
    }
  };

  const renderCollapseHandler = () => {
    if (item.hasChildren) {
      const collapseHandlerClassNames = classNames('icon select-orgstruct__collapse-handler', {
        'icon-small-right': !item.isOpen,
        'icon-small-down': item.isOpen
      });

      return <span className={collapseHandlerClassNames} />;
    }
  };

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const reload = () => {
    initList();
  };

  const createForm = formConfig => (e, isEditMode = false) => {
    e.stopPropagation();

    const isPerson = formConfig.sourceId === SourcesId.PERSON;
    const extraConfig = {};
    let title;

    set(extraConfig, 'attributes.authorityGroups', [item.id]);

    if (isPerson) {
      extraConfig.recordRef = null;

      title = t(Labels.TITLE_PERSON_ADD);
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
        onSubmit: reload,
        initiator: {
          type: 'form-component',
          name: 'CreateVariants'
        }
      }
    );
  };

  const createPerson = createForm(FORM_CONFIG.PERSON);
  const createGroup = createForm(FORM_CONFIG.AUTHORITY_GROUP);

  const openModal = type => e => {
    e.stopPropagation();
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = e => {
    e.stopPropagation();
    setModalOpen(false);
    reload();
  };

  const openPersonModal = openModal('person');
  const openGroupModal = openModal('group');

  const deleteFromGroup = e => {
    closeModal(e);
    deleteItem({ ...item });
    reload();
  };

  const groupConfig = {
    text: t(Labels.CONFIRM_GROUP_DELETE),
    buttons: [
      {
        text: t(Labels.CANCEL),
        className: 'gray',
        handleClick: closeModal
      },
      // {
      //   text: t(Labels.FULL_DELETE),
      //   className: 'red',
      //   handleClick: (e) => {
      //     closeModal(e);

      //     Records.remove(item.id);
      //   }
      // },
      {
        text: t(Labels.GROUP_DELETE),
        // className: 'green',
        handleClick: closeModal
      }
    ]
  };

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
        // className: 'green',
        handleClick: deleteFromGroup
      }
    ]
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

    if (modalType === 'group') {
      return <ModalContent config={groupConfig} />;
    }

    return null;
  };

  const handleModalClick = e => {
    e.stopPropagation();
  };

  const selectPerson = e => {
    e.stopPropagation();
    dispatch(setSelectedPerson({ recordRef: item.id }));
    dispatch(getDashboardConfig({ recordRef: item.id }));
    updateCurrentUrl({ recordRef: item.id });
  };

  const isPerson = item.id.includes(SourcesId.PERSON);
  const isGroup = item.id.includes(SourcesId.GROUP);

  return (
    <li>
      <div
        className={classNames('select-orgstruct__list-item', `select-orgstruct__list-item_level-${nestingLevel}`, 'orgstructure-page', {
          'select-orgstruct__list-item_strong': item.isStrong
        })}
        onClick={isPerson ? selectPerson : noop}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={classNames('select-orgstruct__list-item-label', 'orgstructure-page', {
            'select-orgstruct__list-item-label_clickable': item.hasChildren,
            'select-orgstruct__list-item-label_margin-left': nestingLevel > 0 && !item.hasChildren
          })}
          onClick={onClickLabel}
        >
          <div className="orgstructure-page__list-item-container">
            <div>
              {renderCollapseHandler()}
              {renderListItem(item, nestingLevel)}
            </div>

            <div
              className={classNames('orgstructure-page__list-item-icons', {
                'orgstructure-page__list-item-icons_hidden': !hovered
              })}
            >
              {isPerson ? <span title={t(Labels.TITLE_PERSON_DELETE)} className="icon-user-away" onClick={openPersonModal} /> : null}
              {isPerson ? (
                <span
                  title={t(Labels.TITLE_PERSON_SELECT)}
                  className={classNames(['icon-user-normal', { 'icon-user-normal__clicked': selected }])}
                  onClick={selectPerson}
                />
              ) : null}
              {isGroup ? <GroupIcon title={t(Labels.TITLE_GROUP_EDIT)} className="icon-edit" onClick={e => createGroup(e, true)} /> : null}
              {isGroup ? <GroupIcon title={t(Labels.TITLE_GROUP_DELETE)} className="icon-users orange" onClick={openGroupModal} /> : null}
              {isGroup ? <GroupIcon title={t(Labels.TITLE_SUBGROUP_CREATE)} className="icon-users green" onClick={createGroup} /> : null}
              {isGroup ? <GroupIcon title={t(Labels.TITLE_PERSON_ADD)} className="icon-user-online" onClick={createPerson} /> : null}

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
    groupSubType: PropTypes.string
  })
});

ListItem.propTypes = {
  item: itemPropType,
  nestingLevel: PropTypes.number,
  nestedList: PropTypes.node
};

const mapStateToProps = state => ({
  selectedPerson: get(state, 'orgstructure.id', '')
});

export default connect(mapStateToProps)(ListItem);
