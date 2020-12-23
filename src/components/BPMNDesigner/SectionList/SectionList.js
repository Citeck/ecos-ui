import React, { useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import pick from 'lodash/pick';

import { URL } from '../../../constants';
import { t } from '../../../helpers/util';
import { BPMNDesignerService } from '../../../services/BPMNDesignerService';
import PageService from '../../../services/PageService';
import { setActiveSection } from '../../../actions/bpmn';
import { CollapsibleList } from '../../common';

import styles from './SectionList.module.scss';
import '../style.scss';

function SectionList({ sectionList = [], setActive, activeSection }) {
  const menuItems = useMemo(() => {
    const list = BPMNDesignerService.getMenuItems({});
    list.push(...sectionList);
    return list;
  }, [sectionList]);

  useEffect(() => {
    if (activeSection) {
      const query = queryString.parseUrl(window.location.href).query;

      if (isEmpty(query)) {
        setActive(menuItems[0]);
      } else {
        setActive(menuItems.find(item => item.journalId === query.journalId));
      }
    }
  }, [sectionList]);

  const onClick = item => {
    setActive(item);
    let href = '';

    if (item.href) {
      href = item.href;
    } else if (item.journalId) {
      href = queryString.stringifyUrl({ url: URL.BPMN_DESIGNER, query: pick(item, ['journalId']) });
    } else {
      console.warn('Unknown section');
      return;
    }

    PageService.changeUrlLink(href, { updateUrl: true, pushHistory: true });
  };

  const renderItems = () => {
    return menuItems.map(item => (
      <div className={styles.item} key={item.label} onClick={onClick}>
        {t(item.label)}
      </div>
    ));
  };

  const getSelectedI = () => {
    return menuItems.findIndex(item => isEqual(item, activeSection));
  };

  return (
    <div className="common-container_white">
      <CollapsibleList needScrollbar list={renderItems()} selected={getSelectedI()} />
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
