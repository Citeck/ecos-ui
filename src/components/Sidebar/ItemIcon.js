import React from 'react';
import { connect } from 'react-redux';
import { loadMenuItemIconUrl } from '../../actions/slideMenu';
import { Icon } from '../common';
import PropTypes from 'prop-types';

const mapDispatchToProps = dispatch => ({
  loadMenuItemIconUrl: (iconName, cb) => dispatch(loadMenuItemIconUrl(iconName, cb))
});

class ItemIcon extends React.Component {
  static propTypes = {
    iconName: PropTypes.string
  };

  static defaultProps = {
    iconName: ''
  };

  state = {
    data: null
  };

  componentDidMount() {
    const { iconName, loadMenuItemIconUrl } = this.props;

    if (iconName) {
      loadMenuItemIconUrl(iconName, data => this.setState({ data }));
    }
  }

  render() {
    const { data } = this.state;
    const emptyIcon = <Icon className="ecos-sidebar-item__icon icon-empty-icon" />;

    if (!data) {
      return emptyIcon;
    }

    switch (data.type) {
      case 'fa':
        return <Icon className={`ecos-sidebar-item__icon fa ${data.value}`} />;
      case 'img':
        if (!data.value) {
          return emptyIcon;
        }
        const url = `/share/proxy/alfresco/api/node/workspace/SpacesStore/${data.value}/content;cm:content`;
        const backgroundImage = `url(${url})`;

        return <div className="ecos-sidebar-item__icon-img" style={{ backgroundImage }} />;
      default:
        return emptyIcon;
    }
  }
}

export default connect(
  null,
  mapDispatchToProps
)(ItemIcon);
