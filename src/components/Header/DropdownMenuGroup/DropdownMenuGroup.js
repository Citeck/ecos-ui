import React from 'react';
import DropDownMenuItem from '../DropdownMenuItem';
import { t } from '../../../helpers/util';

const DropDownMenuGroup = props => {
  const { id, label, items } = props;
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
