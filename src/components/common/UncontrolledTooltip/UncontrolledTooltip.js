import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';
import omit from 'lodash/omit';

const omitKeys = ['defaultOpen'];

export const baseModifiersUncontrolled = {
  offset: {
    name: 'offset',
    enabled: true,
    offset: '0, 5px'
  }
};

export default class UncontrolledTooltip extends Component {
  constructor(props) {
    super(props);

    this.state = { isOpen: props.defaultOpen || false };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState({ isOpen: !this.state.isOpen });
  }

  render() {
    return <Tooltip isOpen={this.state.isOpen} toggle={this.toggle} {...omit(this.props, omitKeys)} />;
  }
}

UncontrolledTooltip.propTypes = {
  defaultOpen: PropTypes.bool,
  ...Tooltip.propTypes
};
