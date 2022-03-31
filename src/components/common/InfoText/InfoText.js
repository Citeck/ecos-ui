import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './style.scss';

const Types = {
  INFO: 'info',
  ERROR: 'error',
  WARN: 'warn'
};

export default class InfoText extends React.Component {
  static propTypes = {
    text: PropTypes.string,
    type: PropTypes.oneOf([Types.INFO, Types.ERROR, Types.WARN, 'primary']),
    className: PropTypes.string,
    noIndents: PropTypes.bool
  };

  static defaultProps = {
    text: '',
    type: Types.INFO,
    className: '',
    noIndents: false
  };

  render() {
    const { text, type, noIndents, className } = this.props;
    const classes = classNames(className, 'ecos-info-text', `ecos-info-text_${type}`, { 'ecos-info-text_no-indents': noIndents });

    return <div className={classes}>{text}</div>;
  }
}
