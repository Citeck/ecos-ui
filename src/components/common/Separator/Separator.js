import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './style.scss';

export default class Separator extends React.Component {
  static propTypes = {
    noIndents: PropTypes.bool,
    className: PropTypes.string
  };

  static defaultProps = {
    noIndents: false,
    className: ''
  };

  render() {
    const { noIndents, className } = this.props;
    const classes = classNames(className, 'ecos-separator', { 'ecos-separator_no-indents': noIndents });

    return <div className={classes} />;
  }
}
