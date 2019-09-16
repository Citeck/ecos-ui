import React from 'react';
import { connect } from 'react-redux';
import { t } from '../../helpers/util';
import handleControl from '../../helpers/handleControl';
import ListItemIcon from './ListItemIcon';

const mapDispatchToProps = dispatch => ({
  dispatch
});

const ListItemCreateSite = ({ item, toggleSlideMenu, dispatch }) => {
  const targetUrl = null;
  const clickHandler = () => {
    handleControl('ALF_CREATE_SITE', null, dispatch);
    toggleSlideMenu();
  };

  return (
    <a href={targetUrl} onClick={clickHandler} className="slide-menu-list__link">
      <ListItemIcon item={item} />
      <span className="slide-menu-list__link-label">{t(item.label)}</span>
    </a>
  );
};

export default connect(
  null,
  mapDispatchToProps
)(ListItemCreateSite);
