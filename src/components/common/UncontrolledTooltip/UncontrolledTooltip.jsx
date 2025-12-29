import omit from 'lodash/omit';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Tooltip } from 'reactstrap';

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

  componentDidMount() {
    this.checkTarget();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.target !== this.props.target) {
      this.checkTarget();
    }
  }

  checkTarget() {
    const target = this.props.target;
    const el = document.getElementById(target);
    if (el) {
      this.setState({ hasTarget: true });
    }
  }

  toggle() {
    this.setState({ isOpen: !this.state.isOpen });
  }

  render() {
    if (!this.state.hasTarget) {
      return null;
    }

    return <Tooltip isOpen={this.state.isOpen} toggle={this.toggle} {...omit(this.props, omitKeys)} />;
  }
}

UncontrolledTooltip.propTypes = {
  defaultOpen: PropTypes.bool,
  ...Tooltip.propTypes
};
