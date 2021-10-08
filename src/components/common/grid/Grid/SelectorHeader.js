import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import uniqueId from 'lodash/uniqueId';
import { Tooltip } from 'reactstrap';

import { t } from '../../../../helpers/util';
import { Checkbox } from '../../form';
import { Icon } from '../../';
import { SELECTOR_MENU, SELECTOR_MODE } from '../util';

import '../../Tooltip/style.scss';
import './Grid.scss';

const SelectorHeader = ({ indeterminate, mode, checked, disabled, hasMenu, onClickMenu }) => {
  const [target] = useState(uniqueId('SelectorHeader-'));
  const [isOpen, setOpen] = useState(false);

  const handleToggleOpener = useCallback(
    e => {
      e.stopPropagation();
      setOpen(!isOpen);
    },
    [isOpen]
  );

  const handleClickItem = useCallback((e, item) => {
    e.stopPropagation();
    onClickMenu && onClickMenu(item);
    setOpen(false);
  }, []);

  return (
    <div className={classNames('ecos-grid__checkbox', { 'ecos-grid__checkbox_has-menu': hasMenu })}>
      {mode === SELECTOR_MODE.CHECKBOX && (
        <>
          <Checkbox indeterminate={indeterminate} checked={checked} disabled={disabled} />
          {hasMenu && (
            <>
              <Tooltip
                target={target}
                isOpen={isOpen}
                placement="bottom"
                className="ecos-base-tooltip"
                arrowClassName="ecos-grid__checkbox-menu-arrow"
                innerClassName="ecos-base-tooltip-inner ecos-grid__checkbox-menu-inner"
                popperClassName="ecos-base-tooltip-popper"
                delay={0}
              >
                {SELECTOR_MENU.map(item => (
                  <div
                    key={target + item.id}
                    className="ecos-base-tooltip-item ecos-grid__checkbox-menu-item"
                    onClick={e => handleClickItem(e, item)}
                  >
                    {t(item.title)}
                  </div>
                ))}
              </Tooltip>
              <Icon
                className={classNames('ecos-grid__checkbox-menu-opener', { 'icon-small-down': !isOpen, 'icon-small-up': isOpen })}
                id={target}
                onClick={handleToggleOpener}
              />
            </>
          )}
        </>
      )}
      <div className="ecos-grid__checkbox-divider" />
    </div>
  );
};

export default SelectorHeader;
