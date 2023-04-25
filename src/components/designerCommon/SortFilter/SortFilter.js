import React from 'react';
import cn from 'classnames';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { SORT_FILTER_LAST_MODIFIED, SORT_FILTER_OLD, SORT_FILTER_AZ, SORT_FILTER_ZA } from '../../../constants/commonDesigner';
import { t } from '../../../../helpers/util';
import styles from './SortFilter.module.scss';

class SortFilter extends React.Component {
  state = {
    dropdownOpen: false
  };

  sortVariants = [
    {
      type: SORT_FILTER_LAST_MODIFIED,
      label: t('designer.sort-filter.latest')
    },
    {
      type: SORT_FILTER_OLD,
      label: t('designer.sort-filter.old')
    },
    {
      type: SORT_FILTER_AZ,
      label: t('designer.sort-filter.a-z')
    },
    {
      type: SORT_FILTER_ZA,
      label: t('designer.sort-filter.z-a')
    }
  ];

  toggle = () => {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  };

  render() {
    const { activeSortFilter, setActiveSortFilter } = this.props;
    const activeItem = this.sortVariants.find(item => item.type === activeSortFilter) || this.sortVariants[0];
    const selectableItems = this.sortVariants
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

export default SortFilter;
