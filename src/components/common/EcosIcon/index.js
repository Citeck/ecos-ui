import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { createContentUrl } from '../../../helpers/urls';
import { MenuApi } from '../../../api';
import { Icon } from '../index';

import './style.scss';

const menuApi = new MenuApi();

function EcosIcon({ code, className, data, title, source }) {
  const [remoteData, setRemoteData] = useState({});
  const emptyIcon = <Icon className={classNames('ecos-sidebar-item__icon icon-empty-icon', className)} />;
  const { type, value } = remoteData || {};

  useEffect(() => {
    if (source === 'menu' && code) {
      menuApi.getMenuItemIconUrl(code).then(data => setRemoteData(data));
    } else {
      setRemoteData(data);
    }
  }, [code, data]);

  switch (type) {
    case 'icon':
      return <Icon className={classNames('ecos-icon', value, className)} title={title} />;
    case 'fa':
      return <Icon className={classNames('ecos-icon fa', value, className)} title={title} />;
    case 'img':
      if (!value) {
        return emptyIcon;
      }

      const url = createContentUrl({ value });

      return (
        <div className={classNames('ecos-icon-img', className)} title={title}>
          <img src={url} alt={title} />
        </div>
      );
    default:
      return emptyIcon;
  }
}

EcosIcon.propTypes = {
  className: PropTypes.string,
  code: PropTypes.string,
  title: PropTypes.string,
  source: PropTypes.string,
  data: PropTypes.shape({
    type: PropTypes.string,
    value: PropTypes.string
  })
};

EcosIcon.defaultProps = {
  className: '',
  code: '',
  title: ''
};

export default React.memo(EcosIcon);
