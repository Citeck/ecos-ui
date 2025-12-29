import classNames from 'classnames';
import React from 'react';
import { Dropdown as Drd, DropdownMenu, DropdownToggle } from 'reactstrap';

import ChevronDown from '@/components/common/icons/ChevronDown';
import { t } from '@/helpers/util';

import './JournalsSettingsBar.scss';

export default function OverflowMenu({ isCollapsed, children }: { isCollapsed?: boolean; children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!isCollapsed) {
    return children;
  }

  const toggle = (e: React.MouseEvent<HTMLElement>) => {
    const container = e.currentTarget as HTMLElement;
    const hasItemGroupAction = container.querySelector('.ecos-group-actions__dropdown-item') !== null;
    if (hasItemGroupAction) {
      return;
    }

    setIsOpen(!isOpen);
  };

  return (
    <Drd className="overflow-menu" isOpen={isOpen} toggle={toggle}>
      <DropdownToggle className={classNames('overflow-menu_btn-toggle', { active: isOpen })} onClick={toggle}>
        <span className="overflow-menu_btn-toggle_text">{t('more')}</span>
        <ChevronDown width={18.26} height={18.26} />
      </DropdownToggle>
      <DropdownMenu className="overflow-menu_dropdown" isCollapsed={isCollapsed}>
        <div className="overflow-menu_dropdown-content">{children}</div>
      </DropdownMenu>
    </Drd>
  );
}
