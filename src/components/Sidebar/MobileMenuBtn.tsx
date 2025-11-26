import React from 'react';

import InlineMenuIcon from '../common/icons/InlineMenu';
import './style.scss';

interface Props {
  openMenu: () => void;
}

export default function MobileMenuBtn({ openMenu }: Props) {
  return (
    <button className="ecos-sidebar-toggle__menu_btn" onClick={openMenu}>
      <InlineMenuIcon />
    </button>
  );
}
