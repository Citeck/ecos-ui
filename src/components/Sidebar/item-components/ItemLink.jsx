import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React from 'react';

import SS from '../../../services/sidebar';

class ItemLink extends React.PureComponent {
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
    const { children, data, extraParams, handleClick, ...props } = this.props;

    if (isEmpty(data)) {
      return null;
    }

    const { targetUrl, attributes } = SS.getPropsUrl(data, extraParams);

    return (
      <a
        href={targetUrl}
        {...attributes}
        {...props}
        disabled={!targetUrl}
        className="ecos-sidebar-item__link"
        onClick={() => {
          isFunction(handleClick) && handleClick(data.id);
        }}
      >
        {children}
      </a>
    );
  }
}

export default ItemLink;
