import React from 'react';

import AddUserIcon from '@/components/common/icons/AddUser';
import CreateUserIcon from '@/components/common/icons/CreateUser';
import EditIcon from '@/components/common/icons/Edit';
import PlusIcon from '@/components/common/icons/Plus';
import RemovePersonIcon from '@/components/common/icons/RemovePerson';
import SelectPersonIcon from '@/components/common/icons/SelectPerson';

import './ListItem.scss';

const mapSvg = {
  edit: {
    icon: <EditIcon />
  },
  'add-group': {
    icon: <PlusIcon />,
    className: 'small-icon'
  },
  'add-user': {
    icon: <AddUserIcon />
  },
  'create-user': {
    icon: <CreateUserIcon />
  },
  'remove-person': {
    icon: <RemovePersonIcon />
  },
  'select-person': {
    icon: <SelectPersonIcon />
  }
};

const GroupIcon = ({ title, className, onClick, icon }) => {
  return (
    <span
      title={title}
      className={['orgstructure-page__list-item-icons-group', className, mapSvg[icon].className].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      {mapSvg[icon].icon}
    </span>
  );
};

export default GroupIcon;
