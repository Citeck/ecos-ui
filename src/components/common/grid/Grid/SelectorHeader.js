import React, { useCallback, useState } from 'react';
import { Tooltip } from 'reactstrap';
import uniqueId from 'lodash/uniqueId';

import { t } from '../../../../helpers/util';
import { Checkbox } from '../../form';
import { Icon } from '../../';
import { SELECTOR_MENU } from '../util';

import '../../Tooltip/style.scss';
import './Grid.scss';

const SelectorHeader = ({ indeterminate, mode, checked, disabled }) => {
  const [target] = useState(uniqueId('SelectorHeader-'));
  const [isOpen, setOpen] = useState(false);
  const handleToggleOpener = useCallback(
    e => {
      e.stopPropagation();
      setOpen(!isOpen);
    },
    [isOpen]
  );

  const handleClickItem = useCallback(e => {
    e.stopPropagation();
  }, []);

  return (
    <div className="ecos-grid__checkbox">
      {mode === 'checkbox' && (
        <>
          <Checkbox indeterminate={indeterminate} checked={checked} disabled={disabled} />
          <Tooltip
            target={target}
            isOpen={isOpen}
            placement="bottom"
            className="ecos-base-tooltip"
            arrowClassName="ecos-grid__checkbox-menu-arrow"
            innerClassName="ecos-base-tooltip-inner ecos-grid__checkbox-menu-inner"
            popperClassName="ecos-base-tooltip-popper"
          >
            {SELECTOR_MENU.map(item => (
              <div key={target + item.id} className="ecos-base-tooltip-item ecos-grid__checkbox-menu-item" onClick={handleClickItem}>
                {t(item.title)}
              </div>
            ))}
          </Tooltip>
          <Icon className="icon-small-down ecos-grid__checkbox-menu-opener" id={target} onClick={handleToggleOpener} />
        </>
      )}
      <div className="ecos-grid__checkbox-divider" />
    </div>
  );
};

export default SelectorHeader;
