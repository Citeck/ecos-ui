import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { cloneDeep } from 'lodash';

import { SortableContainer, SortableElement, SortableHandle } from '../Drag-n-Drop';
import { t } from '../../helpers/util';

import './style.scss';

class TopMenu extends Component {
  static propTypes = {
    links: PropTypes.array,
    isShow: PropTypes.bool,
    isSortable: PropTypes.bool,
    isLoading: PropTypes.bool,
    onSave: PropTypes.func
  };

  static defaultProps = {
    links: [],
    isShow: false,
    isSortable: false,
    onSave: () => {}
  };

  constructor(props) {
    super(props);

    this.state = {
      links: props.links,
      draggableNode: null
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isLoading && JSON.stringify(nextProps.links) !== JSON.stringify(this.state.links)) {
      this.setState({ links: nextProps.links });
    }
  }

  handleSortEndMenu = ({ oldIndex, newIndex }, event) => {
    const { draggableNode, links: stateLinks } = this.state;
    let links = cloneDeep(stateLinks);
    const draggableLink = links[oldIndex];

    event.stopPropagation();
    draggableNode.classList.toggle('ecos-layout__menu-item_sorting');

    links.splice(oldIndex, 1);
    links.splice(newIndex, 0, draggableLink);
    links.forEach((link, index) => {
      link.position = index;
    });

    this.setState({ links, draggableNode: null }, () => {
      this.props.onSave(links);
    });
  };

  handleBeforeSortStart = ({ node }) => {
    node.classList.toggle('ecos-layout__menu-item_sorting');

    this.setState({ draggableNode: node });
  };

  renderSortable() {
    const { links } = this.state;

    return (
      <SortableContainer axis="xy" onSortEnd={this.handleSortEndMenu} updateBeforeSortStart={this.handleBeforeSortStart} useDragHandle>
        <div className="ecos-layout__menu ecos-layout__menu_big">{links && links.map(this.renderMenuItem)}</div>
      </SortableContainer>
    );
  }

  renderMenuItem = link => (
    <SortableElement key={link.position} index={link.position}>
      <Link className="ecos-layout__menu-item" to={link.link} title={t(link.label)}>
        <div className="ecos-layout__menu-item-title">{t(link.label)}</div>
        <i className="ecos-btn__i ecos-layout__menu-item-i-next" />

        <SortableHandle>
          <i className="ecos-btn__i icon-custom-drag-big ecos-layout__menu-item-i-drag" />
        </SortableHandle>
      </Link>
    </SortableElement>
  );

  render() {
    const { isShow, isSortable } = this.props;
    const { links } = this.state;

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
