import classNames from 'classnames';
import set from 'lodash/set';
import uniqueId from 'lodash/uniqueId';
import React, { useCallback, useState } from 'react';
import BootstrapTableConst from 'react-bootstrap-table-next/lib/src/const';
import { Tooltip } from 'reactstrap';

import { t } from '../../../../helpers/util';
import ZIndex from '../../../../services/ZIndex';
import { Checkbox } from '../../form';
import Icon from '../../icons/Icon/Icon';
import { SELECTOR_MENU } from '../util';

import '../../Tooltip/style.scss';
import './Grid.scss';

const SelectorHeader = ({ indeterminate, mode, checked, disabled, hasMenu, onClickMenu }) => {
  const [target] = useState(uniqueId('SelectorHeader-'));
  const [isOpen, setOpen] = useState(false);

  const selectable = mode === BootstrapTableConst.ROW_SELECT_MULTIPLE;

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

  const handleClick = e => {
    if (!selectable) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <div className={classNames('ecos-grid__checkbox', { 'ecos-grid__checkbox_has-menu': hasMenu })} onClick={handleClick}>
      {selectable && (
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
                fade={false}
                modifiers={{
                  computeStyles: {
                    name: 'computeStyles',
                    enabled: true,
                    phase: 'write',
                    fn: instance => {
                      set(instance, 'styles.zIndex', ZIndex.topZ);

                      return instance;
                    }
                  }
                }}
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
