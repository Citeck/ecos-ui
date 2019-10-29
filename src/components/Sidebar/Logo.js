import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { URL } from '../../constants';

const Logo = ({ logos, large = false }) => {
  return (
    <div
      className={classNames('ecos-sidebar-logo', {
        'ecos-sidebar-logo_small': !large,
        'ecos-sidebar-logo_large': large
      })}
    >
      <a className="ecos-sidebar-logo__link" href={URL.DASHBOARD}>
        <img
          className="ecos-sidebar-logo__img ecos-sidebar-logo__img_large"
          src={logos.large}
          alt="logo"
          style={{ opacity: Number(large) }}
        />
        <img
          className="ecos-sidebar-logo__img ecos-sidebar-logo__img_small"
          src={logos.small}
          alt="logo"
          style={{ opacity: Number(!large) }}
        />
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
