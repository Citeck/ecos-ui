import React from 'react';
import { connect } from 'react-redux';
import { loadMenuItemIconUrl } from '../../actions/slideMenu';

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
    const emptyIcon = <i className={`fa fa-menu-default-icon`} />;

    if (!data) {
      return emptyIcon;
    }

    switch (data.type) {
      case 'fa':
        return <i className={`fa fa-menu-default-icon ${data.value}`} />;
      case 'img':
        if (!data.value) {
          return emptyIcon;
        }
        const url = `/share/proxy/alfresco/api/node/workspace/SpacesStore/${data.value}/content;cm:content`;
        const backgroundImage = `url(${url})`;

        return <div className="list-item-icon-img" style={{ backgroundImage }} />;
      default:
        return emptyIcon;
    }
  }
}

export default connect(
  null,
  mapDispatchToProps
)(ListItemIcon);
