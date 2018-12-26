import React from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { SORT_FILTER_LAST_MODIFIED, SORT_FILTER_OLD, SORT_FILTER_AZ, SORT_FILTER_ZA } from '../../../../constants/bpmn';
import { setActiveSortFilter } from '../../../../actions/bpmn';
import { t } from '../../../../helpers/util';
import styles from './SortFilter.module.scss';

const sortVariants = [
  {
    type: SORT_FILTER_LAST_MODIFIED,
    label: t('bpmn-designer.sort-filter.latest')
  },
  {
    type: SORT_FILTER_OLD,
    label: t('bpmn-designer.sort-filter.old')
  },
  {
    type: SORT_FILTER_AZ,
    label: t('bpmn-designer.sort-filter.a-z')
  },
  {
    type: SORT_FILTER_ZA,
    label: t('bpmn-designer.sort-filter.z-a')
  }
];

const mapStateToProps = state => ({
  activeSortFilter: state.bpmn.sortFilter
});

const mapDispatchToProps = dispatch => ({
  setActiveSortFilter: value => dispatch(setActiveSortFilter(value))
});

class SortFilter extends React.Component {
  state = {
    dropdownOpen: false
  };

  toggle = () => {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  };

  render() {
    const { activeSortFilter, setActiveSortFilter } = this.props;
    const activeItem = sortVariants.find(item => item.type === activeSortFilter) || sortVariants[0];
    const selectableItems = sortVariants
      .filter(item => item.type !== activeItem.type)
      .map(item => {
        return (
          <li
            key={item.type}
            onClick={() => {
              setActiveSortFilter(item.type);
              this.toggle();
            }}
          >
            {item.label}
          </li>
        );
      });

    return (
      <div className={styles.wrapper}>
        <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle}>
          <DropdownToggle tag="div" className={cn(styles.toggle, { [styles.toggleIsOpen]: this.state.dropdownOpen })}>
            {activeItem.label}
          </DropdownToggle>
          <DropdownMenu className={styles.dropdownMenu}>
            <ul>{selectableItems}</ul>
          </DropdownMenu>
        </Dropdown>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SortFilter);
