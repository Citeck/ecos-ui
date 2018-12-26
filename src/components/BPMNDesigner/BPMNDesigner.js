import React from 'react';
import { connect } from 'react-redux';
import { Button, Badge, Container, Row, Col } from 'reactstrap';
import Categories from './Categories';
import ControlPanel from './ControlPanel';
import RightMenu from './RightMenu';
import { showModelCreationForm } from '../../actions/modelCreationForm';
import styles from './BPMNDesigner.module.scss';
import './BPMNDesigner.scss';

const categories = [
  {
    label: 'Департамент дизайна',
    level: 0,
    models: 4,
    categories: [
      {
        label: 'Отдел ландшафтного дизайна',
        level: 1,
        models: 4,
        categories: [
          {
            label: 'Заголовок третьего уровня',
            level: 2,
            models: 4
          },
          {
            label: 'Заголовок третьего уровня 2',
            level: 2,
            isEditable: true
          }
        ]
      },
      {
        label: 'Отдел ландшафтного дизайна 2',
        level: 1,
        isEditable: true
      }
    ]
  },
  {
    label: 'Департамент дизайна 2',
    level: 0,
    models: 4,
    categories: [
      {
        label: 'Отдел ландшафтного дизайна',
        level: 1,
        models: 4,
        categories: [
          {
            label: 'Заголовок третьего уровня',
            level: 2,
            models: 4
          }
        ]
      }
    ]
  },
  {
    label: 'Департамент дизайна 3',
    level: 0,
    models: 0,
    categories: [
      {
        label: 'Отдел ландшафтного дизайна',
        level: 1,
        models: 0,
        categories: [
          {
            label: 'Заголовок третьего уровня',
            level: 2,
            models: 0
          }
        ]
      }
    ]
  },
  {
    label: 'Департамент чего-то там',
    level: 0,
    isEditable: true
  }
];

function BPMNDesigner({ showModelCreationForm }) {
  return (
    <Container>
      <Row>
        <Col xl={9} lg={8} md={12}>
          <div className={styles.header}>
            <p className={styles.counter}>
              Всего{' '}
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
            <Button onClick={showModelCreationForm} color="primary" size="lg" className={styles.headerBtn}>
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

export default connect(
  null,
  dispatch => ({
    showModelCreationForm: () => dispatch(showModelCreationForm())
  })
)(BPMNDesigner);
