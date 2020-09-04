import React from 'react';
import PropTypes from 'prop-types';
import SS from '../../../services/sidebar';

class ItemLink extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    data: PropTypes.object,
    extraParams: PropTypes.object
  };

  static defaultProps = {
    className: '',
    data: {},
    extraParams: {}
  };

  render() {
    const { children, data, extraParams, ...props } = this.props;
    const { targetUrl, attributes } = SS.getPropsUrl(data, extraParams);

    return (
      <a href={targetUrl} {...attributes} {...props} disabled={!targetUrl} className="ecos-sidebar-item__link">
        {children}
      </a>
    );
  }
}

export default ItemLink;
