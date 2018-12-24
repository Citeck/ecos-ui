import React from 'react';
import { connect } from 'react-redux';
import { Button, Badge, Container, Row, Col } from 'reactstrap';
import Categories from './Categories';
import ControlPanel from './ControlPanel';
import RightMenu from './RightMenu';
import { t } from '../../helpers/util';
import styles from './BPMNDesigner.module.scss';
import './BPMNDesigner.scss';

const mapStateToProps = state => ({
  isReady: state.bpmn.isReady,
  totalModels: state.bpmn.models.length
});

const BPMNDesigner = ({ isReady, totalModels }) => {
  if (!isReady) {
    return null;
  }

  return (
    <Container>
      <Row>
        <Col xl={9} lg={8} md={12}>
          <div className={styles.header}>
            <p className={styles.counter}>
              {t('bpmn-designer.total')}
              <Badge color="primary" pill>
                {totalModels}
              </Badge>
            </p>
            <h2 className={styles.h2}>{t('bpmn-designer.process-models.header')}</h2>
          </div>
        </Col>
      </Row>
      <Row noGutters>
        <Col xl={3} lg={{ size: 4, order: 2 }} md={12}>
          <RightMenu />
        </Col>

        <Col xl={9} lg={8} md={12}>
          <div className={styles.whiteBlock}>
            <Button color="primary" size="lg" className={styles.headerBtn}>
              {t('bpmn-designer.create-model')}
            </Button>
            <Button color="secondary" size="lg" className={styles.headerBtn}>
              {t('bpmn-designer.import-model')}
            </Button>
          </div>
          <ControlPanel />
          <Categories />
          <div className={styles.addCategoryBlock}>
            <a href="/share/page/bpmn-designer">{t('bpmn-designer.add-category')}</a>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default connect(mapStateToProps)(BPMNDesigner);
