import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { TMP_ICON_EMPTY } from '../../../constants';
import { createContentUrl } from '../../../helpers/urls';
import { MenuApi } from '../../../api/menu';
import Icon from '../icons/Icon/Icon';

import './style.scss';

const menuApi = new MenuApi();

function EcosIcon({ code, className, data, title, family, onClick, id, defaultVal }) {
  const [remoteData, setRemoteData] = useState({});
  const { type, value, url } = remoteData || {};
  const commonClass = classNames('ecos-icon', className, { 'ecos-icon_button': onClick });
  const commonProps = { title, id };

  const onError = () => {
    setRemoteData({});
  };

  if (onClick) {
    commonProps.onClick = onClick;
  }

  useEffect(
    () => {
      if (family === 'menu-items' && code) {
        menuApi.getMenuItemIconUrl(code).then(data => setRemoteData(data));
      } else {
        setRemoteData(data);
      }
    },
    [code, data]
  );

  if (type === 'img' && !!(value || url)) {
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
