import React, { Component } from 'react';
import classNames from 'classnames';
import { Col, FormGroup, Label } from 'reactstrap';

import './Field.scss';

export default class Field extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('ecos-field', props.className);

    return (
      <FormGroup row className={cssClasses}>
        <Label title={props.label} xs={12} sm={3} md={3} lg={2} className={'ecos-field__label'}>
          {props.label}
        </Label>
        <Col xs={12} sm={9} md={9} lg={9} className={'ecos-field__control'}>
          {props.children}
        </Col>
      </FormGroup>
    );
  }
}
