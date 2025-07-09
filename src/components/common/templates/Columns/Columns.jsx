import classNames from 'classnames';
import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';

import './Columns.scss';

export default class Columns extends Component {
  render() {
    const props = this.props;
    const cols = props.cols || [];
    const cfgs = props.cfgs || [];

    return (
      <Row noGutters className={classNames('columns', props.className)}>
        {cols.map((col, index) => {
          const cfg = cfgs[index] || {};

          return (
            <Col key={index} {...cfg}>
              <div className={classNames('columns__column', !index && 'columns__column_first', props.classNamesColumn)}>{col}</div>
            </Col>
          );
        })}
      </Row>
    );
  }
}
