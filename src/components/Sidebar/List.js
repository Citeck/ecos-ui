import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import Item from './Item';
import SS from '../../services/sidebar';
import { connect } from 'react-redux';

class List extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    data: PropTypes.array,
    level: PropTypes.number,
    isExpanded: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    data: [],
    level: 0,
    isExpanded: true
  };

  state = {
    isExpandedSublist: false,
    styleProps: {}
  };

  constructor(props) {
    super(props);

    const { actionType } = this.parseData(props);
    const styleProps = SS.getPropsStyleLevel({ level: props.level, actionType });

    this.state.isExpanded = styleProps.isDefExpanded;
    this.state.styleProps = styleProps;
  }

  render() {
    const { data, className, level, isExpanded, isOpen } = this.props;
    const nextLvl = level + 1;

    if (isEmpty(data)) {
      return null;
    }

    return (
      <div
        className={classNames('ecos-sidebar-list', `ecos-sidebar-list_lvl-${level}`, className, {
          'ecos-sidebar-list_collapsed': !isExpanded,
          'ecos-sidebar-list_expanded': isExpanded
        })}
      >
        {data.map(item => {
          const id = `lvl-${level}-${item.id}`;

          return (
            <React.Fragment key={id}>
              <Item data={item} level={level} id={id} isExpanded={isExpanded} />
              <List isExpanded={isExpanded} data={item.items} level={nextLvl} />
              {/*{this.isDropList && (*/}
              {/*  <Tooltip*/}
              {/*    target={id}*/}
              {/*    isOpen={isExpanded}*/}
              {/*    placement="right"*/}
              {/*    trigger="click"*/}
              {/*    boundariesElement="div.ecos-base-content"*/}
              {/*    className="ecos-sidebar-list-tooltip"*/}
              {/*    innerClassName="ecos-sidebar-list-tooltip-inner"*/}
              {/*    arrowClassName="ecos-sidebar-list-tooltip-arrow"*/}
              {/*  >*/}
              {/*    <ClickOutside handleClickOutside={this.onCloseTooltip} onClick={this.onCloseTooltip}>*/}
              {/*      <List isExpanded data={items} level={level + 1}/>*/}
              {/*    </ClickOutside>*/}
              {/*  </Tooltip>*/}
              {/*)}*/}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isOpen: state.slideMenu.isOpen
});

export default connect(
  mapStateToProps,
  null
)(List);
