import React, { Component, Fragment } from 'react';
import classNames from 'classnames';
import { trigger } from '../../../../helpers/util';

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

    trigger.call(this, 'onClick', checked);

    this.change({ checked: checked });
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
    trigger.call(this, 'onChange', state);
  }

  render() {
    const state = this.state;
    const props = this.props;
    const cssClasses = classNames('ecos-checkbox', props.className);
    const text = props.children ? <span className={'ecos-checkbox__text'}>{props.children}</span> : null;

    return (
      <span className={cssClasses} onClick={this.toggle}>
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
        {text}
      </span>
    );
  }
}
