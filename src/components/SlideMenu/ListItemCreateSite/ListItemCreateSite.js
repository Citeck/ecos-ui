import React from 'react';
import { connect } from 'react-redux';
import { t } from '../../../helpers/util';
import ListItemIcon from '../ListItemIcon';
import handleControl from '../../../helpers/handleControl';

const mapDispatchToProps = dispatch => ({
  dispatch
});

const ListItemCreateSite = ({ item, toggleSlideMenu, dispatch }) => {
  let label = t(item.label);

  const targetUrl = null;
  const clickHandler = () => {
    handleControl('ALF_CREATE_SITE', null, dispatch);
    toggleSlideMenu();
  };

  return (
    <a href={targetUrl} onClick={clickHandler} className="slide-menu-list__link">
      <ListItemIcon item={item} />
      <span className={'slide-menu-list__link-label'}>{label}</span>
    </a>
  );
};

export default connect(
  null,
  mapDispatchToProps
)(ListItemCreateSite);
