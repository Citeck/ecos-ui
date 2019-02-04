import React, { Component, Fragment } from 'react';
import classNames from 'classnames';
import Button from '../Button/Button';
import Icon from '../../icons/Icon/Icon';

import './IcoButton.scss';

export default class IcoButton extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('ico-button', props.children && 'ico-button_text', props.className);
    const cssIconClasses = classNames('ico-button__icon', props.icon);

    const ico = <Icon className={cssIconClasses} />;
    const text = props.children;

    return (
      <Button {...props} className={cssClasses}>
        {props.invert ? (
          <Fragment>
            {text}
            {ico}
          </Fragment>
        ) : (
          <Fragment>
            {ico}
            {text}
          </Fragment>
        )}
      </Button>
    );
  }
}
