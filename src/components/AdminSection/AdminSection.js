import React, { useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Col, Container, Row } from 'reactstrap';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../helpers/util';
import { Labels, SectionTypes } from '../../constants/adminSection';
import { IcoBtn } from '../common/btns';
import { Caption } from '../common/form';

import SectionList from './SectionList';
import BPMNDesigner from '../BPMNDesigner';
import JournalViewer from './JournalViewer';

import './style.scss';

const AdminSection = ({ isMobile, isReady, activeSection, groupSectionList }) => {
  const [isOpenMenu, setOpenMenu] = useState(false);

  return (
    <div className="ecos-admin-section__container">
      <div className="ecos-admin-section__content">
        <Container fluid className="p-0">
          <Row className="ecos-admin-section__header">
            <Col md={10}>
              <Caption normal>{t(activeSection.label)}</Caption>
            </Col>
            <Col md={2} className="ecos-admin-section__header-right">
              <IcoBtn
                onClick={() => setOpenMenu(true)}
                icon={'icon-small-arrow-left'}
                className={classNames(
                  'ecos-btn_light-blue ecos-btn_hover_dark-blue ecos-btn_narrow-t_standart ecos-btn_r_biggest ecos-admin-section__btn-menu-opener',
                  { 'ecos-admin-section__btn-menu-opener_hidden': isOpenMenu }
                )}
              >
                {isMobile ? t(Labels.SHOW_MENU_sm) : t(Labels.SHOW_MENU)}
              </IcoBtn>
            </Col>
          </Row>

          {!isEmpty(activeSection) && (
            <Row>
              <Col md={12}>
                <BPMNDesigner hidden={activeSection.type !== SectionTypes.BPM} />
                <JournalViewer hidden={activeSection.type !== SectionTypes.JOURNAL} />
              </Col>
            </Row>
          )}
        </Container>
      </div>
      <div className={classNames('ecos-admin-section__menu', { 'ecos-admin-section__menu_open': isOpenMenu })}>
        <div className="ecos-admin-section__menu-content">
          <IcoBtn
            onClick={() => setOpenMenu(false)}
            icon="icon-small-arrow-right"
            invert
            className="ecos-btn_grey5 ecos-btn_hover_grey ecos-btn_narrow-t_standart ecos-btn_r_biggest ecos-admin-section__btn-menu-closer"
          >
            {isMobile ? t(Labels.HIDE_MENU_sm) : t(Labels.HIDE_MENU)}
          </IcoBtn>
          {groupSectionList.map(item => (
            <SectionList key={item.id} list={item.sections} title={item.label} />
          ))}
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  isMobile: state.view.isMobile,
  activeSection: state.adminSection.activeSection || {},
  groupSectionList: state.adminSection.groupSectionList
});

export default connect(mapStateToProps)(AdminSection);
