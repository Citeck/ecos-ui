import { Component } from 'react';
import PropTypes from 'prop-types';

import { run } from '../helpers';

export default class Updatable extends Component {
  static propsTypes = {
    when: PropTypes.bool.isRequired
  };

  state = {
    onceRenderer: false
  };

  constructor(props) {
    super(props);

    this.state.onceRenderer = props.when;
  }

  static getDerivedStateFromProps(props, state) {
    if (props.when && !state.onceRenderer) {
      return {
        onceRenderer: true
      };
    }

    return null;
  }

  shouldComponentUpdate = ({ when }) => when;

  render = () => {
    if (this.state.onceRenderer) {
      return run(this.props, 'children');
    }

    return null;
  };
}
