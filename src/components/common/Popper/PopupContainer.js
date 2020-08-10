import React, { useState, useEffect } from 'react';
import { usePopper } from 'react-popper';
import classNames from 'classnames';
import get from 'lodash/get';

import { popupEmitter, Events } from './emitter';

export const PopupContainer = () => {
  const [referenceElement, setReferenceElement] = useState(null);
  const [text, setText] = useState('');
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'top',
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
          offset: [0, 8]
        }
      }
    ]
  });

  useEffect(() => {
    const onShow = (element, text) => {
      setReferenceElement(element);
      setText(text);
    };
    const onHide = () => {
      setReferenceElement(null);
      setText('');
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
      style={{ ...styles.popper, display: text ? 'unset' : 'none' }}
      {...attributes.popper}
      className={classNames('ecos-popup-manager', get(attributes, 'popper.className', ''))}
    >
      {text}
      <div ref={setArrowElement} style={styles.arrow} className="ecos-popper__arrow" />
    </div>
  );
};
