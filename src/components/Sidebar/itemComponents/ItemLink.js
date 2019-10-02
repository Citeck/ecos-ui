import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { MenuApi } from '../../../api';
import SS from '../../../services/sidebar';

const menuApi = new MenuApi();

const ItemLink = ({ children, data }) => {
  const [isSiteDashboardEnable, setSiteDashboardEnable] = useState('');

  useEffect(() => {
    menuApi.checkSiteDashboardEnable().then(value => setSiteDashboardEnable(value));
  });

  const { targetUrl, attributes } = SS.getPropsUrl(data, { isSiteDashboardEnable });

  return (
    <a href={targetUrl} {...attributes} className="ecos-sidebar-item__link">
      {children}
    </a>
  );
};

ItemLink.propTypes = {
  className: PropTypes.string,
  data: PropTypes.object
};

ItemLink.defaultProps = {
  className: '',
  data: {}
};

export default ItemLink;
