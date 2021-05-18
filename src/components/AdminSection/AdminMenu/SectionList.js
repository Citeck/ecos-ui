import React from 'react';
import { connect } from 'react-redux';

import { t } from '../../../helpers/util';
import { Labels } from '../../../constants/adminSection';
import { setActiveSection } from '../../../actions/adminSection';
import AdminSectionService from '../../../services/AdminSectionService';
import { CollapsibleList } from '../../common';

import './style.scss';

function SectionList({ list = [], title = null, setActive, activeSection }) {
  const renderItems = () => {
    return list.map(item => (
      <div className="ecos-admin-menu-section__item" key={item.label} onClick={() => setActive(item)}>
        {t(item.label)}
      </div>
    ));
  };
  const selected = AdminSectionService.getSelectedSectionIndex(list, activeSection);

  return (
    <CollapsibleList
      className="ecos-admin-menu-section"
      classNameList="ecos-admin-menu-section__list"
      emptyText={t(Labels.EMPTY_LIST)}
      list={renderItems()}
      selected={selected}
    >
      {title}
    </CollapsibleList>
  );
}

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
