import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { cloneDeep } from 'lodash';
import { SortableContainer, SortableElement } from '../Drag-n-Drop';
import { t } from '../../helpers/util';
import './style.scss';

class TopMenu extends Component {
  static propTypes = {
    links: PropTypes.array,
    isShow: PropTypes.bool,
    isSortable: PropTypes.bool,
    onSave: PropTypes.func
  };

  static defaultProps = {
    links: [],
    isShow: false,
    isSortable: false,
    onSave: () => {}
  };

  handleSortEndMenu = ({ oldIndex, newIndex }, event) => {
    let links = cloneDeep(this.props.links);
    const draggableLink = links[oldIndex];

    event.stopPropagation();

    links.splice(oldIndex, 1);
    links.splice(newIndex, 0, draggableLink);
    links.forEach((link, index) => {
      link.position = index;
    });

    this.props.onSave(links);
  };

  renderSortable() {
    const { links } = this.props;

    return (
      <SortableContainer axis="xy" onSortEnd={this.handleSortEndMenu}>
        <div className="ecos-layout__menu">{links && links.map(this.renderMenuItem)}</div>
      </SortableContainer>
    );
  }

  renderMenuItem = link => {
    return (
      <SortableElement key={link.position} index={link.position}>
        <Link className="ecos-layout__menu-item" to={link.link} title={t(link.label)}>
          <div className="ecos-layout__menu-item-title">{t(link.label)}</div>
          <i className="ecos-btn__i ecos-layout__menu-item-i-next" />
          <i className="ecos-btn__i icon-drag ecos-layout__menu-item-i-drag" />
        </Link>
      </SortableElement>
    );
  };

  render() {
    const { isShow, isSortable, links } = this.props;

    if (!isShow) {
      return null;
    }

    if (isSortable) {
      return this.renderSortable();
    }

    return <div className="ecos-layout__menu">{links && links.map(this.renderMenuItem)}</div>;
  }
}

export default TopMenu;
