import classNames from 'classnames';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import Icon from '../icons/Icon';

import { MenuApi } from '@/api/menu';
import { reactIconsModules } from '@/components/common/icons/global';
import { TMP_ICON_EMPTY } from '@/constants';
import { createContentUrl } from '@/helpers/urls';

import './style.scss';

const menuApi = new MenuApi();

function EcosIcon({ code, className, data, title, family, onClick, id, defaultVal }) {
  const [remoteData, setRemoteData] = useState({});
  const { type, value, url, Component, color = '#767676' } = remoteData || {};
  const commonClass = classNames('ecos-icon', className, { 'ecos-icon_button': onClick });
  const commonProps = { title, id };

  const onError = () => {
    setRemoteData({});
  };

  if (onClick) {
    commonProps.onClick = onClick;
  }

  useEffect(() => {
    if (family === 'menu-items' && code) {
      menuApi.getMenuItemIconUrl(code).then(data => setRemoteData(data));
    } else {
      setRemoteData(data);
    }
  }, [code, data]);

  if ((type === 'react-icon' && isFunction(Component)) || value?.includes('react:')) {
    if (isFunction(Component)) {
      return (
        <div className={classNames(commonClass, 'ecos-icon-svg')} {...commonProps}>
          <Component color={color} />
        </div>
      );
    }

    const key = value?.replace('react:', '');
    if (reactIconsModules[key]?.default) {
      const Component = reactIconsModules[key].default;
      return (
        <div className={classNames(commonClass, 'ecos-icon-svg')} {...commonProps}>
          <Component color={color} />
        </div>
      );
    }
  }

  if ((type === 'img' || (type === 'icon' && !!url)) && !!(value || url)) {
    const src = url || createContentUrl({ value });

    return (
      <div className={classNames(commonClass, 'ecos-icon-img')} {...commonProps}>
        <img src={src} alt={title} className="ecos-icon-img__content" onError={onError} />
      </div>
    );
  }

  return <Icon className={classNames(commonClass, { [defaultVal]: !value, fa: type === 'fa', [value]: !!value })} {...commonProps} />;
}

EcosIcon.propTypes = {
  className: PropTypes.string,
  code: PropTypes.string,
  title: PropTypes.string,
  family: PropTypes.string,
  data: PropTypes.shape({
    type: PropTypes.string,
    value: PropTypes.string
  }),
  onClick: PropTypes.func
};

EcosIcon.defaultProps = {
  className: '',
  code: '',
  title: '',
  defaultVal: TMP_ICON_EMPTY
};

export default React.memo(EcosIcon);
