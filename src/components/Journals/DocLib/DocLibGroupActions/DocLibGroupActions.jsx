import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import classNames from 'classnames';

import Loader from '../../../common/Loader/Loader';
import { IcoBtn } from '../../../common/btns';
import { DropdownOuter } from '../../../common/form/Dropdown';
import { t } from '../../../../helpers/export/util';
import Tools from '../../../common/grid/Tools';

import './DocLibGroupActions.scss';

const DocLibGroupActions = props => {
  const { total, groupActions, isMobile, execGroupAction } = props;

  const isReady = get(groupActions, 'isReady', true);
  if (!isReady) {
    return (
      <div className="ecos-doclib__group-actions-loader">
        <Loader type="points" style={{ margin: 0, height: 20 }} />
      </div>
    );
  }

  const forRecords = get(groupActions, 'forRecords', {});

  const forRecordsInlineActions = [];
  const forRecordsDropDownActions = [];
  const actions = forRecords.actions || [];

  if (isEmpty(actions)) {
    return null;
  }

  for (let action of actions) {
    if (action.icon) {
      forRecordsInlineActions.push(action);
    } else {
      forRecordsDropDownActions.push(action);
    }
  }

  const tools = forRecordsInlineActions.map(action => (
    <IcoBtn
      icon={action.icon}
      className="ecos-journal__tool ecos-btn_i_sm ecos-btn_grey4 ecos-btn_hover_t-dark-brown"
      title={action.pluralName}
      onClick={() => execGroupAction(action)}
    />
  ));

  if (forRecordsDropDownActions.length) {
    tools.push(
      <DropdownOuter
        className="ecos-journal__tool-group-dropdown grid-tools__item_left_5"
        source={forRecordsDropDownActions}
        valueField={'id'}
        titleField={'pluralName'}
        keyFields={['id', 'formRef', 'pluralName']}
        isStatic
        onChange={action => execGroupAction(action)}
      >
        <IcoBtn
          invert
          icon={'icon-small-down'}
          className="ecos-journal__tool-group-btn dashlet__btn ecos-btn_extra-narrow grid-tools__item_select-group-actions-btn"
        >
          {t(isMobile ? 'grid.tools.group-actions-mobile' : 'grid.tools.group-actions')}
        </IcoBtn>
      </DropdownOuter>
    );
  }

  return <Tools total={total} className={classNames('ecos-doclib__group-actions', 'grid-tools_r_12')} tools={tools} />;
};

DocLibGroupActions.propTypes = {
  stateId: PropTypes.string,
  total: PropTypes.number,
  groupActions: PropTypes.shape({
    isReady: PropTypes.bool,
    forRecords: PropTypes.shape({
      actions: PropTypes.array
    })
  }),
  isMobile: PropTypes.bool,
  execGroupAction: PropTypes.func
};

export default DocLibGroupActions;
