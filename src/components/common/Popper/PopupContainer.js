import classNames from 'classnames';
import get from 'lodash/get';
import React, { useState, useEffect } from 'react';
import { usePopper } from 'react-popper';

import ZIndex from '../../../services/ZIndex';

import { popupEmitter, Events } from './emitter';

export const PopupContainer = () => {
  const [referenceElement, setReferenceElement] = useState(null);
  const [text, setText] = useState('');
  const [contentClassName, setContentClassName] = useState('');
  const [placement, setPlacement] = useState('top');
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement,
    modifiers: [
      {
        name: 'arrow',
        options: {
          element: arrowElement
        }
      },
      {
        name: 'offset',
        options: {
          offset: [0, 10]
        }
      }
    ]
  });

  useEffect(() => {
    const onShow = (element, text, className = '', placement) => {
      setReferenceElement(element);
      setText(text);
      setContentClassName(className);

      if (!!placement) {
        setPlacement(placement);
      }
    };
    const onHide = () => {
      setReferenceElement(null);
      setText('');
      setContentClassName('');
    };

    popupEmitter.on(Events.SHOW, onShow);
    popupEmitter.on(Events.HIDE, onHide);

    return () => {
      popupEmitter.off(Events.SHOW, onShow);
      popupEmitter.off(Events.HIDE, onHide);
    };
  }, []);

  return (
    <div
      ref={setPopperElement}
      style={{
        ...styles.popper,
        display: text ? 'unset' : 'none',
        zIndex: ZIndex.calcZ()
      }}
      {...attributes.popper}
      className={classNames('ecos-popup-manager ecos-popup-manager_fade-in', get(attributes, 'popper.className', ''))}
    >
      <div className={classNames(contentClassName)}>{text}</div>
      <div
        ref={setArrowElement}
        style={{
          ...styles.arrow,
          '--popper-wrapper-height': `${get(popperElement, 'offsetHeight', 0)}px`
        }}
        className={classNames('ecos-popper__arrow', `ecos-popper__arrow_${get(attributes, 'popper.data-popper-placement')}`)}
      />
    </div>
  );
};
