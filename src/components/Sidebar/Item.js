import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import { Icon } from '../common';
import List from './List';
import RemoteBadge from './RemoteBadge';
import ItemIcon from './ItemIcon';

const mapStateToProps = state => ({
  isOpen: state.slideMenu.isOpen
});

class Item extends React.Component {
  static propTypes = {
    data: PropTypes.array,
    level: PropTypes.number,
    isDefExpanded: PropTypes.bool,
    noIcon: PropTypes.bool,
    noBadge: PropTypes.bool,
    noToggle: PropTypes.bool
  };

  static defaultProps = {
    data: [],
    level: 0,
    isDefExpanded: true,
    noIcon: true,
    noBadge: true,
    isRemoteBadge: false,
    noToggle: true
  };

  state = {
    isExpanded: false
  };

  constructor(props) {
    super(props);

    this.state.isExpanded = props.isDefExpanded;
  }

  toggleList = e => {
    const { isExpanded } = this.state;

    this.setState({ isExpanded: !isExpanded });
    e.stopPropagation();
  };

  render() {
    const { isOpen, data, level, noIcon, noBadge, noToggle, isRemoteBadge, targetUrl, attributes } = this.props;
    const { isExpanded } = this.state;

    if (isEmpty(data)) {
      return null;
    }

    return (
      <li className="ecos-sidebar-item">
        <div className="ecos-sidebar-item__name-wrapper">
          <a href={targetUrl} {...attributes} className="ecos-sidebar-item__link">
            {!noIcon && <ItemIcon iconName={data.icon} />}
            <div className="ecos-sidebar-item__label">{data.label}</div>
          </a>
          {!noBadge && isRemoteBadge && <RemoteBadge data={data} isOpen={isOpen} />}
          {!noToggle && (
            <Icon
              className={classNames('ecos-sidebar-item__toggle', {
                'ecos-sidebar-item__toggle_v': isOpen,
                'ecos-sidebar-item__toggle_h icon-right': !isOpen,
                'icon-down': !isExpanded && isOpen,
                'icon-up': isExpanded && isOpen
              })}
              onClick={this.toggleList}
            />
          )}
        </div>
        <List isExpanded={isExpanded} data={data.items} level={level + 1} />
      </li>
    );
  }
}

export default connect(
  mapStateToProps,
  null
)(Item);
