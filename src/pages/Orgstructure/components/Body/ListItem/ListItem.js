import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import noop from 'lodash/noop';
import { connect } from 'react-redux';

import { SelectOrgstructContext } from '../../../../../components/common/form/SelectOrgstruct/SelectOrgstructContext';
import { EcosModal } from '../../../../../components/common';
import FormManager from '../../../../../components/EcosForm/FormManager';
import ModalContent from '../ModalContent';
import { setSelectedPerson } from '../../../../../actions/orgstructure';
import { t } from '../../../../../helpers/util';
import { updateCurrentUrl } from '../../../../../helpers/urls';

import './ListItem.scss';
import { getDashboardConfig } from '../../../../../actions/dashboard';

const Labels = {
  TITLE_PERSON: 'orgstructure-delete-modal-title-person',
  TITLE_GROUP: 'orgstructure-delete-modal-title-group',
  BODY_PERSON: 'orgstructure-delete-modal-body-person',
  BODY_GROUP: 'orgstructure-delete-modal-body-group',
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
    sourceId: 'emodel/authority-group',
    typeRef: 'emodel/type@authority-group',
    formRef: 'uiserv/form@authority-group-form'
  },
  PERSON: {
    id: 'DEFAULT',
    name: {
      ru: 'Пользователь',
      en: 'Person'
    },
    sourceId: 'emodel/person',
    typeRef: 'emodel/type@person',
    formRef: 'uiserv/form@person-form'
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

  const createForm = formConfig => e => {
    e.stopPropagation();
    FormManager.createRecordByVariant(formConfig, {
      onSubmit: reload,
      initiator: {
        type: 'form-component',
        name: 'CreateVariants'
      }
    });
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

  const fullDelete = e => {
    closeModal(e);
    deleteItem({ ...item });
    reload();
  };

  const groupConfig = {
    text: t(Labels.BODY_GROUP),
    buttons: [
      {
        text: t(Labels.CANCEL),
        className: 'gray',
        handleClick: closeModal
      },
      {
        text: t(Labels.FULL_DELETE),
        className: 'red',
        handleClick: fullDelete
      },
      {
        text: t(Labels.GROUP_DELETE),
        className: 'green',
        handleClick: closeModal
      }
    ]
  };

  const personConfig = {
    text: t(Labels.BODY_PERSON),
    buttons: [
      {
        text: t(Labels.CANCEL),
        className: 'gray',
        handleClick: closeModal
      },
      {
        text: t(Labels.FULL_DELETE),
        className: 'red',
        handleClick: fullDelete
      },
      {
        text: t(Labels.GROUP_DELETE),
        className: 'green',
        handleClick: closeModal
      }
    ]
  };

  let modalTitle = '';
  if (modalType === 'group') {
    modalTitle = t(Labels.TITLE_GROUP);
  }
  if (modalType === 'person') {
    modalTitle = t(Labels.TITLE_PERSON);
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

  const isPerson = item.id.includes('emodel/person');
  const isGroup = item.id.includes('emodel/authority-group');

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
            {hovered ? (
              <div className="orgstructure-page__list-item-icons">
                {isPerson ? <span className="icon-user-away" onClick={openPersonModal} /> : null}
                {isPerson ? (
                  <span className={classNames(['icon-user-normal', { 'icon-user-normal__clicked': selected }])} onClick={selectPerson} />
                ) : null}
                {isGroup ? <span className="icon-users orange" onClick={openGroupModal} /> : null}
                {isGroup ? <span className="icon-users green" onClick={createGroup} /> : null}
                {isGroup ? <span className="icon-user-online" onClick={createPerson} /> : null}
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
            ) : null}
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
