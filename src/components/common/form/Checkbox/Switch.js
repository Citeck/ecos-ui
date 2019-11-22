import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class Switch extends Component {
  static propTypes = {
    className: PropTypes.string,
    checked: PropTypes.bool,
    onToggle: PropTypes.func
  };

  static defaultProps = {
    className: '',
    checked: false,
    onToggle: () => {}
  };

  constructor(props) {
    super(props);

    this.state = {
      checked: props.checked
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.checked !== state.checked) {
      return { checked: props.checked };
    }

    return null;
  }

  handleToggle = () => {
    const { checked } = this.state;

    this.setState({ checked: !checked });
    this.props.onToggle(!checked);
  };

  render() {
    const { className } = this.props;
    const { checked } = this.state;

    return (
      <div
        className={classNames('ecos-switch', className, {
          'ecos-switch_checked': checked
        })}
        onClick={this.handleToggle}
      />
    );
  }
}

export default Switch;
