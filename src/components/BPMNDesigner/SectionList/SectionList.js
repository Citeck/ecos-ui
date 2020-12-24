import React from 'react';
import { connect } from 'react-redux';
import isEqual from 'lodash/isEqual';
import { t } from '../../../helpers/util';
import { setActiveSection } from '../../../actions/bpmn';
import { CollapsibleList } from '../../common';

import '../style.scss';
import './style.scss';

function SectionList({ sectionList = [], setActive, activeSection }) {
  const onClick = item => {
    setActive(item);
  };

  const renderItems = () => {
    return sectionList.map(item => (
      <div className="bpmn-section-list__item" key={item.label} onClick={() => onClick(item)}>
        {t(item.label)}
      </div>
    ));
  };

  const getSelectedI = () => {
    return sectionList.findIndex(item => isEqual(item, activeSection));
  };

  return (
    <div className="bpmn-common-container_white">
      {sectionList.length && <CollapsibleList needScrollbar list={renderItems()} selected={getSelectedI()} />}
    </div>
  );
}

const mapStateToProps = state => ({
  isAdmin: state.user.isAdmin,
  isBpmAdmin: state.user.isBpmAdmin,
  sectionList: state.bpmn.sectionList,
  activeSection: state.bpmn.activeSection
});

const mapDispatchToProps = dispatch => ({
  setActive: item => dispatch(setActiveSection(item))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SectionList);
