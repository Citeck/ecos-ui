import React, { useCallback } from 'react';
import { UncontrolledTooltip } from 'reactstrap';
import isFunction from 'lodash/isFunction';

import { IcoBtn } from '../../common/btns';

import './style.scss';

function DropdownActions({ htmlId, list, ...ddProps }) {
  const _id = `action-dropdown-${htmlId}`;

  const handleItemOnClick = useCallback((event, item, index) => {
    if (isFunction(item.onClick)) {
      item.onClick(event);
      return;
    }

    if (ddProps && isFunction(ddProps.onClick)) {
      ddProps.onClick(item, index);
      return;
    }
  }, []);

  return (
    <>
      <IcoBtn
        id={_id}
        icon="icon-custom-more-big-pressed"
        className="ecos-btn_i dashlet__btn_hidden ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
      />
      <UncontrolledTooltip
        target={_id}
        trigger="hover"
        delay={50}
        autohide={false}
        placement="bottom-end"
        className="ecos-base-tooltip ecos-base-tooltip_opaque ecos-dropdowm-actions"
        innerClassName="ecos-base-tooltip-inner ecos-dropdowm-actions-inner"
        arrowClassName="ecos-base-tooltip-arrow ecos-dropdowm-actions-arrow"
      >
        {list.map((item, index) =>
          item.component ? (
            <React.Fragment key={item.id}>
              {item.component} {!!item.text && item.text}
            </React.Fragment>
          ) : (
            <IcoBtn
              key={item.id}
              icon={item.icon}
              onClick={e => handleItemOnClick(e, item, index)}
              className="ecos-dropdowm-actions__btn ecos-dropdowm-actions__btn_with-text ecos-btn_grey6 ecos-btn_r_0"
            >
              {item.text}
            </IcoBtn>
          )
        )}
      </UncontrolledTooltip>
    </>
  );
}

export default DropdownActions;
