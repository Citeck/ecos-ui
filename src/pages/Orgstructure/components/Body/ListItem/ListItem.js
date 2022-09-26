import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import { SelectOrgstructContext } from '../../../../../components/common/form/SelectOrgstruct/SelectOrgstructContext';
import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER, TabTypes } from '../../../../../components/common/form/SelectOrgstruct/constants';

import './ListItem.scss';
import { EcosModal } from '../../../../../components/common';
import FormManager from '../../../../../components/EcosForm/FormManager';
import Records from '../../../../../components/Records';
import ModalContent from '../ModalContent';
import { setSelectedPerson } from '../../../../../actions/orgstructure';
import connect from 'react-redux/es/connect/connect';

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

const ListItem = ({ item, nestingLevel, nestedList, dispatch, reloadList, deleteItem }) => {
  const context = useContext(SelectOrgstructContext);
  const [hovered, setHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const { controlProps = {}, renderListItem } = context;
  const { allowedAuthorityTypes, allowedGroupTypes, allowedGroupSubTypes } = controlProps;

  const itemAuthorityType = get(item, 'attributes.authorityType');
  const itemGroupType = get(item, 'attributes.groupType', '').toUpperCase();
  const itemGroupSubType = get(item, 'attributes.groupSubType', '');

  const isAllowedSelect =
    allowedAuthorityTypes.includes(itemAuthorityType) &&
    (itemAuthorityType === AUTHORITY_TYPE_USER ||
      (itemAuthorityType === AUTHORITY_TYPE_GROUP &&
        allowedGroupTypes.includes(itemGroupType) &&
        (allowedGroupSubTypes.length === 0 || allowedGroupSubTypes.includes(itemGroupSubType))));

  const onClickLabel = () => {
    if (item.hasChildren) {
      context.onToggleCollapse(item);
    }
  };

  const onDoubleClick = e => {
    if (isAllowedSelect) {
      e.stopPropagation();
      context.onToggleSelectItem(item, true);
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

  const listItemClassNames = classNames(
    'select-orgstruct__list-item',
    `select-orgstruct__list-item_level-${nestingLevel}`,
    'orgstructure-page',
    {
      'select-orgstruct__list-item_strong': item.isStrong
    }
  );

  const listItemLabelClassNames = classNames('select-orgstruct__list-item-label', 'orgstructure-page', {
    'select-orgstruct__list-item-label_clickable': item.hasChildren,
    'select-orgstruct__list-item-label_margin-left': nestingLevel > 0 && !item.hasChildren
  });

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const reload = () => {
    // TODO заменить на перезагрузку данных
    reloadList();
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
  };

  const openPersonModal = openModal('person');
  const openGroupModal = openModal('group');

  const fullDelete = e => {
    closeModal(e);
    deleteItem({ ...item });
    // reload();
  };

  const groupConfig = {
    text: 'Вы действительно хотите удалить эту группу?',
    buttons: [
      {
        text: 'Отмена',
        className: 'gray',
        handleClick: closeModal
      },
      {
        text: 'Удалить полностью',
        className: 'red',
        handleClick: fullDelete
      },
      {
        text: 'Удалить из группы',
        className: 'green',
        handleClick: closeModal
      }
    ]
  };
  // TODO добавить локализацию
  const personConfig = {
    text: 'Вы действительно хотите удалить этого пользователя?',
    buttons: [
      {
        text: 'Отмена',
        className: 'gray',
        handleClick: closeModal
      },
      {
        text: 'Удалить полностью',
        className: 'red',
        handleClick: fullDelete
      },
      {
        text: 'Удалить из группы',
        className: 'green',
        handleClick: closeModal
      }
    ]
  };

  let modalTitle = '';
  if (modalType === 'group') {
    modalTitle = 'Удаление группы';
  }
  if (modalType === 'person') {
    modalTitle = 'Удаление пользователя';
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
    dispatch(setSelectedPerson(item.id));
  };

  console.log('item = ', item);

  const isPerson = item.id.includes('emodel/person') || !item.hasChildren;
  const isGroup = item.id.includes('emodel/authority-group') && item.hasChildren;

  return (
    <li>
      <div className={listItemClassNames} onDoubleClick={onDoubleClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className={listItemLabelClassNames} onClick={onClickLabel}>
          <div className="orgstructure-page__list-item-container">
            <div>
              {renderCollapseHandler()}
              {renderListItem(item)}
            </div>
            {hovered ? (
              <div className="orgstructure-page__list-item-icons">
                {isPerson ? <span className="icon-user-away" onClick={openPersonModal} /> : null}
                {isPerson ? <span className="icon-user-normal" onClick={selectPerson} /> : null}
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

export default connect()(ListItem);
