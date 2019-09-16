import React from 'react';
import { connect } from 'react-redux';
import { loadMenuItemIconUrl } from '../../actions/slideMenu';
import { Icon } from '../common';

const mapDispatchToProps = (dispatch, ownProps) => ({
  loadMenuItemIconUrl: (iconName, cb) => dispatch(loadMenuItemIconUrl(iconName, cb))
});

class ListItemIcon extends React.Component {
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
    const emptyIcon = <Icon className="ecos-slide-menu-item__icon icon-empty-icon" />;

    if (!data) {
      return emptyIcon;
    }

    const { type, value } = data;

    switch (type) {
      case 'fa':
        return <Icon className={`ecos-slide-menu-item__icon fa ${value}`} />;
      case 'img':
        if (!value) {
          return emptyIcon;
        }
        const url = `/share/proxy/alfresco/api/node/workspace/SpacesStore/${value}/content;cm:content`;
        const backgroundImage = `url(${url})`;

        return <div className="ecos-slide-menu-item__icon_img" style={{ backgroundImage }} />;
      default:
        return emptyIcon;
    }
  }
}

export default connect(
  null,
  mapDispatchToProps
)(ListItemIcon);
