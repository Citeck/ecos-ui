import React from 'react';
import PropTypes from 'prop-types';

import '../style.scss';

export default class Base extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    active: PropTypes.bool,
    config: PropTypes.object,
    description: PropTypes.string,
    type: PropTypes.string,
    tooltip: PropTypes.string,
    onClick: PropTypes.func
  };

  static defaultProps = {
    className: '',
    active: false,
    config: {},
    description: '',
    tooltip: '',
    type: '',
    onClick: () => null
  };

  get className() {
    const { className, active } = this.props;
    const classes = ['ecos-layout__item'];

    if (className) {
      classes.push(className);
    }

    if (active) {
      classes.push('ecos-layout__item_active');
    }

    return classes.join(' ');
  }

  renderActiveIcon() {
    const { active } = this.props;

    if (!active) {
      return null;
    }

    return <i className="ecos-layout__item_active-icon fa fa-check-circle" />;
  }

  renderDescription() {
    const { description } = this.props;

    if (!description) {
      return null;
    }

    return <div className="ecos-layout__item-description">{description}</div>;
  }
}
