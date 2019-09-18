import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import SS from '../../services/sidebar';

function ItemConfiguration(WrappedComponent) {
  return class extends React.Component {
    get parseData() {
      const { data } = this.props;

      return {
        items: get(data, 'items', null),
        actionType: get(data, 'action.type', '')
      };
    }

    render() {
      const { level, data } = this.props;
      const { items, actionType } = this.parseData;
      const newProps = SS.getPropsStyleLevel({ level, actionType });
      const urlProps = SS.getPropsUrl(data);

      const props = {
        ...this.props,
        ...newProps,
        ...urlProps
      };

      if (isEmpty(items)) {
        props.noToggle = true;
      }

      return <WrappedComponent {...props} />;
    }
  };
}

ItemConfiguration.propTypes = {
  level: PropTypes.number,
  data: PropTypes.object
};

ItemConfiguration.defaultProps = {
  level: 0,
  data: {}
};

export default ItemConfiguration;
