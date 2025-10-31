import React from 'react';
import classNames from 'classnames';

import { Btn } from '../../../../../components/common/btns';

import './ModalContent.scss';

const ModalContent = ({ config = {} }) => {
  const { buttons, text } = config;

  return (
    <div>
      <div className="orgstructure-page-modal__text">{text || ''}</div>
      {buttons && (
        <div className="orgstructure-page-modal__container">
          {buttons.map((item, index) => (
            <Btn
              onClick={item.handleClick}
              className={classNames(
                {
                  'ecos-btn_light-blue': index === 1
                },
                'orgstructure-page-modal__button',
                `orgstructure-page-modal__${item.className}`
              )}
            >
              {item.text}
            </Btn>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModalContent;
