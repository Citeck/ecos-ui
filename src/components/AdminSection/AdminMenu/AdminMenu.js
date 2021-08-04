import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { fetchGroupSectionList } from '../../../actions/adminSection';
import { t } from '../../../helpers/util';
import { Labels } from '../../../constants/adminSection';
import { IcoBtn } from '../../common/btns';
import SectionList from './SectionList';

import './style.scss';

const AdminMenu = React.memo(({ isMobile, groupSectionList, children, toggle, open, getGroupSectionList }) => {
  const sidebarRef = useRef(null);
  const [topHeight, setTopHeight] = useState(500);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    getGroupSectionList();
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) {
      getGroupSectionList();
      setInitialized(true);
    }
  }, [initialized]);

  useEffect(() => {
    if (open && sidebarRef.current) {
      const params = sidebarRef.current.getBoundingClientRect();
      const top = params.y + 20;

      topHeight !== top && setTopHeight(top);
    }
  }, [sidebarRef, open]);

  return (
    <>
      <IcoBtn
        onClick={() => toggle(true)}
        icon="icon-small-arrow-left"
        className={classNames(
          'ecos-admin-menu__btn-opener ecos-btn_light-blue ecos-btn_hover_dark-blue ecos-btn_narrow-t_standart ecos-btn_r_biggest',
          { 'ecos-admin-menu__btn-opener_hidden': open }
        )}
      >
        {isMobile ? t(Labels.SHOW_MENU_sm) : t(Labels.SHOW_MENU)}
      </IcoBtn>
      <div
        ref={sidebarRef}
        className={classNames('ecos-admin-menu', { 'ecos-admin-menu_open': open })}
        style={{ maxHeight: `calc(100vh - ${topHeight}px)` }}
      >
        <div className="ecos-admin-menu-content">
          <IcoBtn
            onClick={() => toggle(false)}
            icon="icon-small-arrow-right"
            invert
            className="ecos-admin-menu__btn-closer ecos-btn_grey5 ecos-btn_hover_grey ecos-btn_narrow-t_standart ecos-btn_r_biggest"
          >
            {isMobile ? t(Labels.HIDE_MENU_sm) : t(Labels.HIDE_MENU)}
          </IcoBtn>
          {groupSectionList.map(item => (
            <SectionList key={item.id} list={item.sections} title={item.label} />
          ))}
          {children}
        </div>
      </div>
    </>
  );
});

const mapStateToProps = state => ({
  isMobile: state.view.isMobile,
  groupSectionList: state.adminSection.groupSectionList
});

const mapDispatchToProps = dispatch => ({
  getGroupSectionList: () => dispatch(fetchGroupSectionList())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AdminMenu);
