import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { loadMenuItemIconUrl } from '../../../actions/slideMenu';
import { Icon } from '../../common';

class ItemIcon extends React.PureComponent {
  static propTypes = {
    iconName: PropTypes.string,
    title: PropTypes.string
  };

  static defaultProps = {
    iconName: '',
    title: ''
  };

  state = {
    data: null
  };

  fetchIcon = false;

  componentDidMount() {
    const { iconName, loadMenuItemIconUrl } = this.props;

    if (iconName) {
      this.fetchIcon = true;
      loadMenuItemIconUrl(iconName, this.setIcon);
    }
  }

  componentWillUnmount() {
    this.fetchIcon = false;
  }

  setIcon = data => {
    if (this.fetchIcon) {
      this.setState({ data });
      this.fetchIcon = false;
    }
  };

  render() {
    const { data } = this.state;
    const { title } = this.props;
    const emptyIcon = <Icon className="ecos-sidebar-item__icon icon-empty-icon" />;

    if (!data) {
      return emptyIcon;
    }

    switch (data.type) {
      case 'fa':
        return <Icon className={`ecos-sidebar-item__icon fa ${data.value}`} title={title} />;
      case 'img':
        if (!data.value) {
          return emptyIcon;
        }

        const url = `/share/proxy/alfresco/api/node/workspace/SpacesStore/${data.value}/content;cm:content`;

        return (
          <div className="ecos-sidebar-item__icon-img" title={title}>
            <img src={url} alt={title} />
          </div>
        );
      default:
        return emptyIcon;
    }
  }
}

const mapDispatchToProps = dispatch => ({
  loadMenuItemIconUrl: (iconName, cb) => dispatch(loadMenuItemIconUrl(iconName, cb))
});

export default connect(
  null,
  mapDispatchToProps
)(ItemIcon);
