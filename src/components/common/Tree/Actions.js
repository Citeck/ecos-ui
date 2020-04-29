import React from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';
import classNames from 'classnames';

import { t } from '../../../helpers/util';
import { IcoBtn } from '../btns';

const BtnAction = ({ id, text, icon, onClick, component, className = '' }) => {
  if (component) {
    return component;
  }

  return (
    <>
      <IcoBtn
        id={id}
        icon={icon}
        className={classNames('ecos-btn_transparent ecos-btn_width_auto ecos-btn_hover_t-light-blue ecos-tree__action', className)}
        onClick={onClick}
      />
      {text && (
        <UncontrolledTooltip
          target={id}
          delay={0}
          placement="top"
          className="ecos-base-tooltip ecos-base-tooltip_opaque header-action-tooltip"
          innerClassName="ecos-base-tooltip-inner header-action-tooltip-inner"
          arrowClassName="ecos-base-tooltip-arrow"
        >
          {t(text)}
        </UncontrolledTooltip>
      )}
    </>
  );
};

const Actions = ({ actionConfig = [], onClick = () => null }) => {
  return (
    <>
      {actionConfig.map((action, i) => (
        <BtnAction
          key={`tree-action-${i}-${action.type || action.id || ''}`}
          {...action}
          onClick={() => onClick(action.type || action.id)}
        />
      ))}
    </>
  );
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
