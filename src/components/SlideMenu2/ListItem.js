import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { setScrollTop, toggleExpanded } from '../../actions/slideMenu';
import ListItemLink from './ListItemLink';
import ListItemCreateSite from './ListItemCreateSite';

const mapStateToProps = (state, ownProps) => ({
  selectedId: state.slideMenu.selectedId
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  setExpanded: id => dispatch(toggleExpanded(id)),
  setScrollTop: value => dispatch(setScrollTop(value))
});

class ListItem extends React.Component {
  componentDidMount() {
    const { item, selectedId, setScrollTop } = this.props;

    if (selectedId === item.id) {
      const elemRect = this.component.getBoundingClientRect();
      const elemPos = 2 * elemRect.top - elemRect.bottom;

      setScrollTop(elemPos);
    }
  }

  render() {
    let { item, nestedList, setExpanded, isNestedListExpanded } = this.props;
    let itemId = item.id;

    let toggleCollapse = null;
    if (nestedList) {
      let classes = classNames('slide-menu-list__toggle-collapse', { 'slide-menu-list__toggle-collapse_expanded': isNestedListExpanded });

      toggleCollapse = <div className={classes} onClick={() => setExpanded(itemId)} />;
    }

    let component = null;
    if (item.action) {
      switch (item.action.type) {
        case 'CREATE_SITE':
          component = <ListItemCreateSite {...this.props} />;
          break;
        case 'FILTER_LINK':
        case 'JOURNAL_LINK':
        case 'PAGE_LINK':
        case 'SITE_LINK':
        default:
          component = <ListItemLink {...this.props} withNestedList={nestedList} />;
          break;
      }
    }

    return (
      <li ref={el => (this.component = el)} id={itemId}>
        {/*{toggleCollapse}*/}
        {component}
        {nestedList}
      </li>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ListItem);
