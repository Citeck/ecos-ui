import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import DropDownMenuItem from '../DropdownMenuItem';
import { t } from '../../../helpers/util';
import Separator from '../../common/Separator/Separator';

const DropDownMenuGroup = props => {
  const { id, label, items, hideLabel, hideSeparator } = props;
  const groupItems = isEmpty(items)
    ? []
    : items.map((item, key) => {
        return <DropDownMenuItem key={key} data={item} />;
      });

  return (
    <div id={id}>
      {!hideLabel && <div className={'ecos-header-dropdown__group-label'}>{t(label)}</div>}
      {groupItems}
      {!hideSeparator && <Separator noIndents />}
    </div>
  );
};

DropDownMenuGroup.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  items: PropTypes.array,
  hideLabel: PropTypes.bool,
  hideSeparator: PropTypes.bool
};

DropDownMenuGroup.defaultProps = {
  hideLabel: false,
  hideSeparator: false
};

export default DropDownMenuGroup;
