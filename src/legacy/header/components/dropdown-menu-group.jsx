import React from 'react';
import DropDownMenuItem from './dropdown-menu-item';
import { t } from '../../common/util';

const DropDownMenuGroup = ({ id, label, items }) => {
  const groupItems =
    items && items.length > 0
      ? items.map((item, key) => {
          return <DropDownMenuItem key={key} data={item} />;
        })
      : null;

  return (
    <div id={id} className="custom-dropdown-menu-group">
      <p className="custom-dropdown-menu-group__label">{t(label)}</p>
      {groupItems}
    </div>
  );
};

export default DropDownMenuGroup;
