import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

const logoLinkHref = '/share/page';

const Logo = ({ logo, large = false }) => {
  return (
    <div
      className={classNames('ecos-sidebar-logo', {
        'ecos-sidebar-logo_small': !large,
        'ecos-sidebar-logo_large': large
      })}
    >
      <a href={logoLinkHref}>
        <img className="ecos-sidebar-logo__img" src={logo} alt="logo" />
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
