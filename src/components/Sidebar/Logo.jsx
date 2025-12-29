import React, { useState } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { URL as Urls } from '../../constants';
import { Icon } from '../common';
import { t } from '../../helpers/export/util';
import PageService from '../../services/PageService';

const Logo = ({ logos, large = false, link }) => {
  const [isError, setIsError] = useState(false);
  const enabledWorkspaces = get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false);
  const onError = e => {
    console.error('There is problem with LOGO', e);
    setIsError(true);
  };

  const openLink = () => {
    PageService.changeUrlLink(link, { openNewTab: true, closeActiveTab: false });
  };

  return (
    <div
      className={classNames('ecos-sidebar-logo', {
        'ecos-sidebar-logo_small': !large,
        'ecos-sidebar-logo_large': large
      })}
    >
      <div className="ecos-sidebar-logo__link" onClick={openLink} title={t('header.site-menu.go-home-page')}>
        <img
          className="ecos-sidebar-logo__img ecos-sidebar-logo__img_large"
          src={logos.large}
          alt="Home"
          style={{ opacity: Number(!isError && large) }}
          onError={onError}
        />
        <img
          className={classNames('ecos-sidebar-logo__img ecos-sidebar-logo__img_small', {
            'ecos-sidebar-logo__img_small_hide': enabledWorkspaces
          })}
          src={logos.small}
          alt="Home"
          style={{ opacity: Number(!isError && !large) }}
          onError={onError}
        />
        {isError && <Icon className="ecos-sidebar-logo__icon fa fa-home" title="There is problem with LOGO" />}
      </div>
    </div>
  );
};

Logo.propTypes = {
  logo: PropTypes.string,
  link: PropTypes.string,
  large: PropTypes.bool
};

Logo.defaultProps = {
  logo: '',
  link: Urls.DASHBOARD,
  large: false
};

export default Logo;
