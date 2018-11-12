import React from 'react';
import DropDownMenuItem from '../DropdownMenuItem';
import { t } from '../../../helpers/util';

const DropdownMenuCascade = ({ id, label, items }) => {
  const cascadeItems =
    items && items.length > 0
      ? items.map((item, key) => {
          return <DropDownMenuItem key={key} data={item} />;
        })
      : null;

  return (
    <div id={id} className="custom-dropdown-menu-cascad">
      <p className="custom-dropdown-menu-cascad__label">{t(label)}</p>
      <div className="custom-dropdown-menu-cascad__list">{cascadeItems}</div>
    </div>
  );
};

export default DropdownMenuCascade;
