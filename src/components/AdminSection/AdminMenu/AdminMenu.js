import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import { fetchGroupSectionList, toggleMenu, toggleSection } from '../../../actions/adminSection';
import { Labels } from '../../../constants/adminSection';
import { usePrevious } from '../../../hooks';
import { Search } from '../../common';
import { IcoBtn } from '../../common/btns';
import SectionList from './SectionList';

import './style.scss';

const AdminMenu = React.memo(
  ({
    isMobile,
    groupSectionList,
    children,
    toggleMenu,
    getGroupSectionList,
    activeSection,
    isOpen,
    toggleSection,
    sectionState,
    isInitiated
  }) => {
    const sidebarRef = useRef(null);
    const [topHeight, setTopHeight] = useState(500);
    const [searchText, setSearchText] = useState('');
    const [needRecalculateSize, setNeedRecalculateSize] = useState(false);
    const prevActiveSection = usePrevious(activeSection);
    const prevIsInitiated = usePrevious(isInitiated);

    useEffect(() => {
      !isInitiated && getGroupSectionList();
    }, []);

    useEffect(
      () => {
        if (isInitiated && !prevIsInitiated) {
          getGroupSectionList();
        }
      },
      [isInitiated]
    );

    useEffect(
      () => {
        if (!isEqual(activeSection, prevActiveSection)) {
          setNeedRecalculateSize(true);
        }
      },
      [activeSection]
    );

    useEffect(
      () => {
        if (isOpen && sidebarRef.current) {
          const params = sidebarRef.current.getBoundingClientRect();
          const top = params.y + 20;

          topHeight !== top && setTopHeight(top);
          setNeedRecalculateSize(false);
        }
      },
      [sidebarRef, isOpen, needRecalculateSize]
    );

    const filterList = list => {
      const compare = item => new RegExp(`(${searchText})`, 'ig').test(get(item, 'label'));
      return !searchText ? list : list.filter(compare);
    };

    return (
      <>
        <IcoBtn
          onClick={() => toggleMenu(true)}
          icon="icon-small-arrow-left"
          className={classNames(
            'ecos-admin-menu__btn-opener ecos-btn_light-blue ecos-btn_hover_dark-blue ecos-btn_narrow-t_standard ecos-btn_r_biggest',
            { 'ecos-admin-menu__btn-opener_hidden': isOpen }
          )}
        >
          {isMobile ? t(Labels.SHOW_MENU_sm) : t(Labels.SHOW_MENU)}
        </IcoBtn>
        <div
          ref={sidebarRef}
          className={classNames('ecos-admin-menu', { 'ecos-admin-menu_open': isOpen })}
          style={{ maxHeight: `calc(100vh - ${topHeight}px)` }}
        >
          <div className="ecos-admin-menu-content">
            <IcoBtn
              onClick={() => toggleMenu(false)}
              icon="icon-small-arrow-right"
              invert
              className="ecos-admin-menu__btn-closer ecos-btn_grey5 ecos-btn_hover_grey ecos-btn_narrow-t_standard ecos-btn_r_biggest"
            >
              {isMobile ? t(Labels.HIDE_MENU_sm) : t(Labels.HIDE_MENU)}
            </IcoBtn>
            <div className="ecos-admin-menu__search-block">
              <Search cleaner liveSearch searchWithEmpty onSearch={setSearchText} className="ecos-admin-menu__search-field" />
            </div>
            {groupSectionList.map(item => (
              <SectionList
                key={item.id}
                list={filterList(item.sections)}
                title={item.label}
                isOpen={get(sectionState, [item.id], true)}
                onToggle={isOpen => toggleSection(item.id, isOpen)}
              />
            ))}
            {children}
          </div>
        </div>
      </>
    );
  }
);

const mapStateToProps = state => ({
  isMobile: state.view.isMobile,
  isOpen: state.adminSection.isOpenMenu,
  activeSection: state.adminSection.activeSection,
  sectionState: state.adminSection.sectionState,
  groupSectionList: state.adminSection.groupSectionList,
  isInitiated: state.adminSection.isInitiated
});

const mapDispatchToProps = dispatch => ({
  getGroupSectionList: () => dispatch(fetchGroupSectionList()),
  toggleMenu: isOpen => dispatch(toggleMenu(isOpen)),
  toggleSection: (id, isOpen) => dispatch(toggleSection({ id, isOpen }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AdminMenu);
