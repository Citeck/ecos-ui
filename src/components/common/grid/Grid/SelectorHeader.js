import React from 'react';

import { Checkbox, DropdownOuter } from '../../form';
import { Icon } from '../../';

const source = [
  {
    title: 'all',
    id: '1'
  },
  {
    title: 'allall',
    id: '2'
  },
  {
    title: 'allalallalll',
    id: '3'
  }
];

const SelectorHeader = ({ indeterminate, ...rest }) => {
  return (
    <div className="ecos-grid__checkbox">
      {rest.mode === 'checkbox' && (
        <>
          <Checkbox indeterminate={indeterminate} checked={rest.checked} disabled={rest.disabled} />
          <DropdownOuter className="ecos-grid__checkbox-dropdown" source={source} titleField="title" isStatic onChange={_ => _}>
            <Icon className="icon-small-down ecos-grid__checkbox-menu" />
          </DropdownOuter>
        </>
      )}
      <div className="ecos-grid__checkbox-divider" />
    </div>
  );
};

export default SelectorHeader;
