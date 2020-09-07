import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { createContentUrl } from '../../../helpers/urls';
import { MenuApi } from '../../../api/menu';
import { Icon } from '../index';

import './style.scss';

const menuApi = new MenuApi();

function EcosIcon({ code, className, data, title, source, onClick }) {
  const [remoteData, setRemoteData] = useState({});
  const { type, value, url } = remoteData || {};
  const commonClass = classNames('ecos-icon', className, { 'ecos-icon_button': onClick });
  const commonProps = { title };

  if (onClick) {
    commonProps.onClick = onClick;
  }

  useEffect(() => {
    if (source === 'menu' && code) {
      menuApi.getMenuItemIconUrl(code).then(data => setRemoteData(data));
    } else {
      setRemoteData(data);
    }
  }, [code, data]);

  if (type === 'img' && !!(value || url)) {
    const src = url || createContentUrl({ value });

    return (
      <div className={classNames(commonClass, 'ecos-icon-img')} {...commonProps}>
        <img src={src} alt={title} />
      </div>
    );
  }

  return <Icon className={classNames(commonClass, { 'icon-empty': !value, fa: type === 'fa', [value]: !!value })} {...commonProps} />;
}

EcosIcon.propTypes = {
  className: PropTypes.string,
  code: PropTypes.string,
  title: PropTypes.string,
  source: PropTypes.string,
  data: PropTypes.shape({
    type: PropTypes.string,
    value: PropTypes.string
  }),
  onClick: PropTypes.func
};

EcosIcon.defaultProps = {
  className: '',
  code: '',
  title: ''
};

export default React.memo(EcosIcon);
