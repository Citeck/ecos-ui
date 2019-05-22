import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import { cloneDeep } from 'lodash';
import Layout from '../../components/Layout';

import './style.scss';

export default class DashboardSettings extends React.Component {
  state = {
    columns: [
      {
        position: 0,
        isActive: true,
        columns: [{ width: '25%' }, {}]
      },
      {
        position: 1,
        isActive: false,
        columns: [{ width: '25%' }, {}]
      },
      {
        position: 2,
        isActive: false,
        columns: [{ width: '25%' }, {}, { width: '25%' }]
      },
      {
        position: 3,
        isActive: false,
        columns: [{}, {}, {}, {}]
      },
      {
        position: 4,
        isActive: false,
        columns: []
      }
    ]
  };

  handleClick(column) {
    let columns = cloneDeep(this.state.columns);

    if (column.isActive) {
      return;
    }

    columns = columns.map(item => {
      if (item.isActive) {
        item.isActive = false;
      }

      if (item.position === column.position) {
        item.isActive = true;
      }

      return item;
    });

    this.setState({ columns });
  }

  renderColumnLayouts() {
    const { columns } = this.state;

    return columns.map(layout => (
      <Layout
        key={layout.position}
        onClick={this.handleClick.bind(this, layout)}
        active={layout.isActive}
        config={{ columns: layout.columns }}
        className="ecos-ds__container-group-item"
      />
    ));
  }

  render() {
    return (
      <Container>
        <Row>
          <Col md={12}>
            <h1 className="ecos-ds__header">Настройки домашней страницы</h1>
          </Col>
        </Row>

        <div className="ecos-ds__container">
          <h5 className="ecos-ds__container-title">Колонки</h5>
          <h6 className="ecos-ds__container-subtitle">Выберите расположение и количество колонок.</h6>
          <div className="ecos-ds__container-group">{this.renderColumnLayouts()}</div>
        </div>
      </Container>
    );
  }
}
