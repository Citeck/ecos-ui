import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';
import Columns from '../Columns/Columns';

import './ColumnsWithHeader.scss';

export default class ColumnsWithHeader extends Component {
  render() {
    const props = this.props;
    const cfgs = [
      {
        xl: 9,
        lg: 8,
        md: 12
      },
      {
        xl: 3,
        lg: { size: 4, order: 2 },
        md: 12
      }
    ];

    return (
      <div className={'two-columns-with-header'}>
        <Row>
          <Col>
            <div className={'two-columns-with-header__header'}>{props.children}</div>
          </Col>
        </Row>

        <Columns cols={props.cols} cfgs={cfgs} />
      </div>
    );
  }
}
