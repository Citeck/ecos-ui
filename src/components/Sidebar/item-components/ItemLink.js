import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';

import SS from '../../../services/sidebar';

class ItemLink extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    data: PropTypes.object,
    extraParams: PropTypes.object,
    handleClick: PropTypes.func
  };

  static defaultProps = {
    className: '',
    data: {},
    extraParams: {},
    handleClick: () => {}
  };

  render() {
    const { children, data, extraParams, ...props } = this.props;

    if (isEmpty(data)) {
      return null;
    }

    const { targetUrl, attributes } = SS.getPropsUrl(data, extraParams);

    const handleClick = () => {
      this.props.handleClick(data.id);
    };

    return (
      <a href={targetUrl} {...attributes} {...props} disabled={!targetUrl} className="ecos-sidebar-item__link" onClick={handleClick}>
        {children}
      </a>
    );
  }
}

export default ItemLink;
