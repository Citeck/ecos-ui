import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

const logoLinkHref = '/share/page';

const Logo = ({ logo, large = false }) => {
  return (
    <div
      className={classNames('ecos-slide-menu-logo', {
        'ecos-slide-menu-logo_small': !large,
        'ecos-slide-menu-logo_large': large
      })}
    >
      <a href={logoLinkHref}>
        <img className="ecos-slide-menu-logo__img" src={logo} alt="logo" />
      </a>
    </div>
  );
};

Logo.propTypes = {
  logo: PropTypes.string,
  large: PropTypes.bool
};

Logo.defaultProps = {
  logo: '',
  large: false
};

export default Logo;
