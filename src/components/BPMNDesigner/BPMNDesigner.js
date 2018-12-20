import React from 'react';
import { connect } from 'react-redux';
import { Button, Badge, Container, Row, Col } from 'reactstrap';
import Categories from './Categories';
import ControlPanel from './ControlPanel';
import RightMenu from './RightMenu';
import styles from './BPMNDesigner.module.scss';
import './BPMNDesigner.scss';

import { categories } from './tempData';

function BPMNDesigner() {
  return (
    <Container>
      <Row>
        <Col xl={9} lg={8} md={12}>
          <div className={styles.header}>
            <p className={styles.counter}>
              Всего
              <Badge color="primary" pill>
                10
              </Badge>
            </p>
            <h2 className={styles.h2}>Модели бизнес процессов</h2>
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
              Создать модель
            </Button>
            <Button color="secondary" size="lg" className={styles.headerBtn}>
              Импортировать
            </Button>
          </div>
          <ControlPanel />
          <Categories items={categories} />
          <div className={styles.addCategoryBlock}>
            <a href="/share/page/bpmn-designer">Добавить категорию</a>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default connect()(BPMNDesigner);
