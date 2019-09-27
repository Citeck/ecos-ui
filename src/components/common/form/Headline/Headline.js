import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './style.scss';

class Headline extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    noHighlight: PropTypes.bool,
    inline: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    noHighlight: false,
    inline: false
  };

  render() {
    const { className, children, noHighlight, inline } = this.props;
    const classes = classNames('ecos-headline', className, {
      'ecos-headline_highlight': !noHighlight,
      'ecos-headline_inline': inline
    });

    return <div className={classes}>{children}</div>;
  }
}

export default Headline;
