import React from 'react';
import { connect } from 'react-redux';
import { Button, Badge, Container, Row, Col } from 'reactstrap';
import CategoriesList from './CategoriesList';
import ControlPanel from './ControlPanel';
import RightMenu from './RightMenu';
import styles from './BPMNDesigner.module.scss';
import './BPMNDesigner.scss';

function BPMNDesigner() {
  return (
    <Container>
      <Row>
        <Col xs="8">
          <div className={styles.header}>
            <p className={styles.counter}>
              Всего{' '}
              <Badge color="primary" pill>
                0
              </Badge>
            </p>
            <h2 className={styles.h2}>Модели бизнес процессов</h2>
          </div>
        </Col>
      </Row>
      <Row noGutters>
        <Col xs="8">
          <div className={styles.whiteBlock}>
            <Button color="primary" size="lg" className={styles.headerBtn}>
              Создать модель
            </Button>
            <Button color="secondary" size="lg" className={styles.headerBtn}>
              Импортировать
            </Button>
          </div>
          <ControlPanel />
          <CategoriesList />
          <div className={styles.addCategoryBlock}>
            <a href="/share/page/bpmn-designer">Добавить категорию</a>
          </div>
        </Col>
        <Col xs="4">
          <RightMenu />
        </Col>
      </Row>
    </Container>
  );
}

export default connect()(BPMNDesigner);
