import React, { Component } from 'react';
import classNames from 'classnames';
import Button from '../Button/Button';
import Icon from '../../icons/Icon/Icon';

import './IcoButton.scss';

export default class IcoButton extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('ico-button', props.children && 'ico-button_text', props.className);
    const cssIconClasses = classNames('ico-button__icon', props.icon);

    return (
      <Button className={cssClasses}>
        <Icon className={cssIconClasses} />
        {props.children}
      </Button>
    );
  }
}
