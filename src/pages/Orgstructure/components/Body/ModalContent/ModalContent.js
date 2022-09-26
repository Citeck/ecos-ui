import React from 'react';
import './ModalContent.scss';

const ModalContent = ({ config = {} }) => {
  const { buttons, text } = config;
  return (
    <div>
      <div className="orgstructure-page-modal__text">{text || ''}</div>
      <div className="orgstructure-page-modal__container">
        {buttons
          ? buttons.map(item => (
              <button onClick={item.handleClick} className={`orgstructure-page-modal__button orgstructure-page-modal__${item.className}`}>
                {item.text}
              </button>
            ))
          : null}

        {/* <button className="orgstructure-page-modal__button orgstructure-page-modal__red">Удалить полностью</button>
        <button className="orgstructure-page-modal__button orgstructure-page-modal__green">Удалить из группы</button> */}
      </div>
    </div>
  );
};

export default ModalContent;
