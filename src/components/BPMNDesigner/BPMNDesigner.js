import React, { useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Col, Container, Row } from 'reactstrap';

import { t } from '../../helpers/util';
import { Labels } from '../../constants/bpmn';
import { Loader } from '../common';
import { IcoBtn } from '../common/btns';
import { Caption } from '../common/form';

import SectionList from './SectionList';
import ModelsViewer from './ModelsViewer';
import JournalViewer from './JournalViewer';

import './style.scss';

const BPMNDesigner = ({ isMobile, isReady, activeSection }) => {
  const [isOpenMenu, setOpenMenu] = useState(false);

  return (
    <div className="bpmn-designer-page__container">
      <div className="bpmn-designer-page__content">
        <Container fluid className="p-0">
          <Row className="bpmn-designer-page__header">
            <Col md={10}>
              <Caption normal>{t(Labels.TITLE_PAGE)}</Caption>
            </Col>
            <Col md={2} className="bpmn-designer-page__header-right">
              <IcoBtn
                onClick={() => setOpenMenu(true)}
                icon={'icon-small-arrow-left'}
                className={classNames(
                  'ecos-btn_light-blue ecos-btn_hover_dark-blue ecos-btn_narrow-t_standart ecos-btn_r_biggest bpmn-designer-page__btn-menu-opener',
                  { 'bpmn-designer-page__btn-menu-opener_hidden': isOpenMenu }
                )}
              >
                {isMobile ? t(Labels.SHOW_MENU_sm) : t(Labels.SHOW_MENU)}
              </IcoBtn>
            </Col>
          </Row>
          {!isReady && (
            <div className="bpmn-common-container_white bpmn-designer-page__loader">
              <Loader />
            </div>
          )}
          {isReady && (
            <Row>
              <Col md={12}>
                <ModelsViewer hidden={activeSection.journalId} />
                <JournalViewer hidden={!activeSection.journalId} />
              </Col>
            </Row>
          )}
        </Container>
      </div>
      <div className={classNames('bpmn-designer-page__menu', { 'bpmn-designer-page__menu_open': isOpenMenu })}>
        <div className="bpmn-designer-page__menu-content">
          <IcoBtn
            onClick={() => setOpenMenu(false)}
            icon="icon-small-arrow-right"
            invert
            className="ecos-btn_grey5 ecos-btn_hover_grey ecos-btn_narrow-t_standart ecos-btn_r_biggest bpmn-designer-page__btn-menu-closer"
          >
            {isMobile ? t(Labels.HIDE_MENU_sm) : t(Labels.HIDE_MENU)}
          </IcoBtn>
          <SectionList />
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  isMobile: state.view.isMobile,
  isReady: state.bpmn.isReady,
  activeSection: state.bpmn.activeSection || {}
});

export default connect(mapStateToProps)(BPMNDesigner);
