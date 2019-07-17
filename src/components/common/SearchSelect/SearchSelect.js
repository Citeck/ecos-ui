import * as React from 'react';
import { debounce } from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { isLastItem, t } from '../../../helpers/util';
import ClickOutside from '../../ClickOutside';
import { Input } from '../form';
import { Icon, Separator } from '../';

import './style.scss';

const Themes = {
  DARK: 'dark',
  LIGHT: 'light'
};

export default class SearchSelect extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    searchResult: PropTypes.array,
    theme: PropTypes.oneOf([Themes.DARK, Themes.LIGHT]),
    autocomplete: PropTypes.bool,
    noResults: PropTypes.bool,
    isSmallMode: PropTypes.bool,
    isMobile: PropTypes.bool,
    onSearch: PropTypes.func,
    openFullSearch: PropTypes.func
  };

  static defaultProps = {
    className: '',
    searchResult: [],
    autocomplete: false,
    isSmallMode: false,
    isMobile: false,
    onSearch: () => {},
    openFullSearch: () => {}
  };

  className = 'ecos-input-search';

  state = {
    searchText: ''
  };

  runSearch = debounce(() => {
    this.props.onSearch(this.state.searchText);
  }, 500);

  getIsLastInGroup(arr, i) {
    return isLastItem(arr, i) || 'groupName' in arr[i + 1];
  }

  onChange = e => {
    this.setState({ searchText: e.target.value }, this.runSearch);
  };

  onKeyDown = e => {
    switch (e.key) {
      case 'Enter':
        this.props.openFullSearch(this.state.searchText);
        break;
      default:
        break;
    }
  };

  toggle = data => {};

  handelItem = data => {};

  handleClickOutside = data => {
    this.setState({ searchText: '' });
    this.props.onSearch('');
  };

  renderNoResults() {
    return <li className={`${this.className}__no-results`}>{t('Ничего не найдено')}</li>;
  }

  render() {
    const { className, theme, autocomplete, searchResult, noResults } = this.props;
    const classNameContainer = classNames(this.className, className, `${this.className}_${theme}`);

    return (
      <ClickOutside handleClickOutside={this.handleClickOutside} className={`${this.className}__click_outside`}>
        <Dropdown className={`${this.className} ecos-header-dropdown`} isOpen={searchResult && autocomplete} toggle={this.toggle}>
          <DropdownToggle tag="div">
            <div className={classNameContainer}>
              <Icon className={classNames(`${this.className}__icon`, 'icon-search')} />
              <Input
                className={classNames(`${this.className}__input`)}
                placeholder={t('Найти файл, человека или сайт')}
                onChange={this.onChange}
                onKeyDown={this.onKeyDown}
              />
            </div>
          </DropdownToggle>
          <DropdownMenu className={`${this.className}__results ecos-dropdown__menu`}>
            {!noResults &&
              searchResult &&
              searchResult.map((item, i, arr) => <Item data={item} onClick={this.handelItem} isLast={this.getIsLastInGroup(arr, i)} />)}
            {noResults && this.renderNoResults()}
          </DropdownMenu>
        </Dropdown>
      </ClickOutside>
    );
  }
}

class Item extends React.PureComponent {
  onClick = () => {
    const { data, onClick } = this.props;

    onClick(data);
  };

  className = 'ecos-input-search-result';

  render() {
    const { isLast, data } = this.props;
    const { icon, title, description, groupName } = data || {};

    return groupName ? (
      <li className={`${this.className}__group-name`}>{groupName}</li>
    ) : (
      <React.Fragment>
        <li onClick={this.onClick} className={this.className}>
          {icon && <Icon className={`${icon} ${this.className}__icon`} />}
          <div>
            <div className={`${this.className}__title`}>{title}</div>
            <div className={`${this.className}__desc`}>{description}</div>
          </div>
        </li>
        {!isLast && <Separator noIndents />}
      </React.Fragment>
    );
  }
}
