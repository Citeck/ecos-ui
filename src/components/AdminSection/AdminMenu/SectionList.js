import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { t } from '../../../helpers/util';
import { Labels } from '../../../constants/adminSection';
import { setActiveSection } from '../../../actions/adminSection';
import AdminSectionService from '../../../services/AdminSectionService';
import { CollapsibleList } from '../../common';

import './style.scss';

const renderItem = (item, onClick) => (
  <div className="ecos-admin-menu-section__item" key={item.label} onClick={() => onClick(item)}>
    {t(item.label)}
  </div>
);

const SectionList = React.memo(({ list = [], title = null, setActive, activeSection, onToggle, isOpen }) => {
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    const newSelected = AdminSectionService.getSelectedSectionIndex(list, activeSection);

    if (newSelected !== selected) {
      setSelected(newSelected);
    }
  }, [list, activeSection]);

  return (
    <CollapsibleList
      className="ecos-admin-menu-section"
      classNameList="ecos-admin-menu-section__list"
      emptyText={t(Labels.EMPTY_LIST)}
      list={list.map(i => renderItem(i, setActive))}
      selected={selected}
      close={!isOpen}
      onTogglePanel={onToggle}
    >
      {title}
    </CollapsibleList>
  );
});

const mapStateToProps = state => ({
  isAdmin: state.user.isAdmin,
  isBpmAdmin: state.user.isBpmAdmin,
  activeSection: state.adminSection.activeSection
});

const mapDispatchToProps = dispatch => ({
  setActive: item => dispatch(setActiveSection(item))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SectionList);
