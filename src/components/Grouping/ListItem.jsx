import React, { Component } from 'react';

import { Label } from '../common/form';

class ListItem extends Component {
  render() {
    const { item, titleField } = this.props;

    return (
      <div className={'two-columns__left columns-setup__column_align '}>
        <i className="icon-custom-drag-big columns-setup__icon-drag" />
        <Label className={'label_clear label_middle-grey columns-setup__next'}>{item[titleField]}</Label>
      </div>
    );
  }
}

export default ListItem;
