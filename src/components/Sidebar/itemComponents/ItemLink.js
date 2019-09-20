import React from 'react';
import PropTypes from 'prop-types';
import SS from '../../../services/sidebar';

class ItemLink extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    data: PropTypes.object
  };

  static defaultProps = {
    className: '',
    data: {}
  };

  render() {
    const { children, data } = this.props;
    const { targetUrl, attributes } = SS.getPropsUrl(data);

    return (
      <a href={targetUrl} {...attributes} className="ecos-sidebar-item__link">
        {children}
      </a>
    );
  }
}

export default ItemLink;
