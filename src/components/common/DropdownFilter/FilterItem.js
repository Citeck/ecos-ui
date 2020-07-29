import React from 'react';
import classNames from 'classnames';
import { Checkbox, Input } from '../form';
import Icon from '../icons/Icon/Icon';
import { t } from '../../../helpers/util';

export default class FilterItem extends React.PureComponent {
  state = {
    search: ''
  };

  className = 'ecos-dropdown-filter__item';

  onClick = checked => {
    this.props.onClick({ item: this.props.item, ...checked });
  };

  onChangeSearch = e => {
    let search = e.target.value;
    this.setState({ search });
  };

  onClean = () => {
    this.setState({ search: '' });
    //this.triggerPendingChange('', this.props.column.dataField);
  };

  onKeyDown = e => {
    switch (e.key) {
      case 'Enter':
        //this.triggerPendingChange(this.state.text, this.props.column.dataField);
        break;
      default:
        break;
    }
  };

  render() {
    const {
      item: { text, dataField }
    } = this.props;
    const { search } = this.state;
    const isAll = 'all-fields' === dataField;
    const _field = 'ecos-dropdown-filter-field';

    return (
      <React.Fragment>
        {isAll && (
          <div className={_field}>
            <Input
              autoFocus
              type="text"
              className={`${_field}__input`}
              onChange={this.onChangeSearch}
              onKeyDown={this.onKeyDown}
              value={search}
              placeholder={t('dropdown-filter.item.placeholder')}
            />

            <Icon className={classNames(`${_field}__close`, 'icon-small-close icon_small')} onClick={this.onClean} />
          </div>
        )}
        <li className={classNames(this.className, { [`${this.className}_all`]: isAll })}>
          <Checkbox onChange={this.onClick}>{text}</Checkbox>
        </li>
      </React.Fragment>
    );
  }
}
