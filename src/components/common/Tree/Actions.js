import React from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';
import classNames from 'classnames';
import uniqueId from 'lodash/uniqueId';

import { t } from '../../../helpers/util';
import { IcoBtn } from '../btns';

const BtnAction = ({ type, text, icon, onClick, component, className = '' }) => {
  if (component) {
    return component;
  }

  const targetId = uniqueId(`menu-item-action-${type}`);

  return (
    <>
      <IcoBtn
        id={targetId}
        icon={icon}
        className={classNames('ecos-btn_transparent ecos-btn_width_auto ecos-btn_hover_t-light-blue ecos-tree__action', className)}
        onClick={onClick}
      />
      {text && (
        <UncontrolledTooltip
          target={targetId}
          delay={0}
          placement="top"
          className="ecos-base-tooltip ecos-base-tooltip_opaque ecos-tree__action-tooltip"
          innerClassName="ecos-base-tooltip-inner"
          arrowClassName="ecos-base-tooltip-arrow"
        >
          {t(text)}
        </UncontrolledTooltip>
      )}
    </>
  );
};

const Actions = ({ actionConfig = [], onClick = () => null }) => {
  return actionConfig.map((action, i) => <BtnAction key={`tree-action-${action.type}`} {...action} onClick={() => onClick(action.type)} />);
};

Actions.propTypes = {
  actionConfig: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      icon: PropTypes.string,
      onClick: PropTypes.func,
      text: PropTypes.string
    })
  )
};

export default Actions;
