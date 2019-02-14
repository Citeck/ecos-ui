import React, { Component, Fragment } from 'react';
import classNames from 'classnames';

import './Checkbox.scss';

export default class Checkbox extends Component {
  constructor(props) {
    super(props);

    this.state = {
      checked: Boolean(props.checked),
      indeterminate: Boolean(props.indeterminate)
    };
  }

  toggle = () => {
    const checked = !this.state.checked;

    if (typeof this.props.onClick === 'function') {
      this.props.onClick.call(this, checked);
    }

    this.change({
      checked: checked
    });
  };

  componentDidUpdate(prevProps) {
    const props = this.props;

    if (props.checked !== prevProps.checked || props.indeterminate !== prevProps.indeterminate) {
      this.change({
        checked: props.checked,
        indeterminate: props.indeterminate
      });
    }
  }

  change(state) {
    this.setState(state);

    if (typeof this.props.onChange === 'function') {
      this.props.onChange.call(this, state);
    }
  }

  render() {
    const state = this.state;
    const props = this.props;
    const cssClasses = classNames('checkbox', props.className);

    return (
      <a className={cssClasses} onClick={this.toggle}>
        <i className="checkbox__i checkbox__i_hover_blue icon-unchecked" />
        {state.indeterminate ? (
          <Fragment>
            <i className="checkbox__i checkbox__i_blue icon-checkbox-dark" />
            <i className="checkbox__i checkbox__i_white icon-checkbox-minus-icon" />
          </Fragment>
        ) : state.checked ? (
          <Fragment>
            <i className="checkbox__i checkbox__i_blue icon-checkbox-dark" />
            <i className="checkbox__i checkbox__i_white  icon-checkbox-check-icon" />
          </Fragment>
        ) : null}
      </a>
    );
  }
}
