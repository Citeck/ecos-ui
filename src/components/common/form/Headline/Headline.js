import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './style.scss';

class Headline extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    noHighlight: PropTypes.bool,
    text: PropTypes.string,
    inline: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    noHighlight: false,
    inline: false
  };

  render() {
    const { className, children, noHighlight, inline, text, ...props } = this.props;
    const classes = classNames('ecos-headline', className, {
      'ecos-headline_highlight': !noHighlight,
      'ecos-headline_inline': inline
    });

    return (
      <div className={classes} {...props}>
        {typeof text === 'string' ? <span className="ecos-headline__text">{text}</span> : children}
      </div>
    );
  }
}

export default Headline;
