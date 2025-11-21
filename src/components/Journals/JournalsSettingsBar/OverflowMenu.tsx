import React from 'react';
import { Dropdown as Drd, DropdownMenu, DropdownToggle } from 'reactstrap';
import './JournalsSettingsBar.scss';

import ChevronDown from '@/components/common/icons/ChevronDown';

export default function OverflowMenu({ isCollapsed, children }: { isCollapsed?: boolean; children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!isCollapsed) {
    return children;
  }

  const toggle = () => setIsOpen(!isOpen);

  return (
    <Drd className="overflow-menu" isOpen={isOpen} toggle={toggle}>
      <DropdownToggle className="overflow-menu_btn-toggle" onClick={toggle}>
        <ChevronDown width={20} height={20} />
      </DropdownToggle>
      <DropdownMenu className="overflow-menu_dropdown" isCollapsed={isCollapsed}>
        <div className="overflow-menu_dropdown-content">{children}</div>
      </DropdownMenu>
    </Drd>
  );
}
