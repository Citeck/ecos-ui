import React from 'react';
import { Checkbox, Input } from '../form';
import Icon from '../icons/Icon/Icon';

export default class FilterItem extends React.PureComponent {
  state = {
    search: ''
  };

  className = 'ecos-dropdown-filter-item';

  onClick = checked => {
    //this.props.onClick(this.props.item);
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

    return (
      <React.Fragment>
        {'all-fields' === dataField && (
          <div>
            <Input
              autoFocus
              type="text"
              className={'ecos-th__filter-tooltip-input'}
              onChange={this.onChangeSearch}
              onKeyDown={this.onKeyDown}
              value={search}
            />

            <Icon className={'ecos-th__filter-tooltip-close icon-close icon_small'} onClick={this.onClean} />
          </div>
        )}
        <li>
          <Checkbox onChange={this.onClick}>{text}</Checkbox>
        </li>
      </React.Fragment>
    );
  }
}
