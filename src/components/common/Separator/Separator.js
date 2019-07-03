import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './style.scss';

export default class Separator extends React.Component {
  static propTypes = {
    noIndents: PropTypes.bool
  };

  static defaultProps = {
    noIndents: false
  };

  render() {
    const { noIndents } = this.props;
    const className = classNames('ecos-separator', { 'ecos-separator_no-indents': noIndents });

    return <div className={className} />;
  }
}
