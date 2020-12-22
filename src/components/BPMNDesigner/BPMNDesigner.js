import React, { useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Col, Container, Row } from 'reactstrap';

import { t } from '../../helpers/util';
import { ROOT_CATEGORY_NODE_REF } from '../../constants/bpmn';
import { IcoBtn } from '../common/btns';
import { Caption } from '../common/form';
import { createCategory } from '../../actions/bpmn';
import Categories from './Categories';
import ControlPanel from './ControlPanel';
import RightMenu from './RightMenu';

import './style.scss';
import styles from './BPMNDesigner.module.scss';

const Labels = {
  TITLE_PAGE: 'bpmn-designer.process-models.header',
  SHOW_MENU: 'journals.action.show-menu',
  SHOW_MENU_sm: 'journals.action.show-menu_sm',
  HIDE_MENU: 'journals.action.hide-menu',
  HIDE_MENU_sm: 'journals.action.hide-menu_sm'
};

const BPMNDesigner = ({ isMobile, isReady, totalModels, createCategory }) => {
  if (!isReady) {
    return null;
  }

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

          <Row>
            <Col md={12}>
              <ControlPanel />
              <Categories categoryId={ROOT_CATEGORY_NODE_REF} />
              <div className={styles.addCategoryBlock} onClick={createCategory}>
                {t('bpmn-designer.add-category')}
              </div>
            </Col>
          </Row>
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
          <RightMenu />
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  isMobile: state.view.isMobile,
  isReady: state.bpmn.isReady,
  totalModels: state.bpmn.models.length
});

const mapDispatchToProps = dispatch => ({
  createCategory: () => dispatch(createCategory({ parentId: ROOT_CATEGORY_NODE_REF }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BPMNDesigner);
