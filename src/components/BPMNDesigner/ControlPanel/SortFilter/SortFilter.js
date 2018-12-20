import React from 'react';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
// import { t } from '../../../../helpers/util';
import styles from './SortFilter.module.scss';
import cn from 'classnames';

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
    // TODO use t() !!!
    return (
      <div className={styles.wrapper}>
        <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle}>
          <DropdownToggle tag="div" className={cn(styles.toggle, { [styles.toggleIsOpen]: this.state.dropdownOpen })}>
            !Последние измененные
          </DropdownToggle>
          <DropdownMenu className={styles.dropdownMenu}>
            <ul>
              <li>!Сначала старые</li>
              <li>!По алфавиту A-Z</li>
              <li>!По алфавиту Z-A</li>
              <li>!Мой порядок</li>
            </ul>
          </DropdownMenu>
        </Dropdown>
      </div>
    );
  }
}

export default SortFilter;
