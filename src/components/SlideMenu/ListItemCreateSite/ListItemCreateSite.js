import React from 'react';
import { t } from '../../../helpers/util';
import ListItemIcon from '../ListItemIcon';

const ListItemCreateSite = ({ item, toggleSlideMenu }) => {
  let label = t(item.label);

  const targetUrl = null;
  const clickHandler = () => {
    toggleSlideMenu();
    window.Citeck.module.getCreateSiteInstance().show();
  };

  return (
    <a href={targetUrl} onClick={clickHandler} className="slide-menu-list__link">
      <ListItemIcon item={item} />
      <span className={'slide-menu-list__link-label'}>{label}</span>
    </a>
  );
};

export default ListItemCreateSite;
