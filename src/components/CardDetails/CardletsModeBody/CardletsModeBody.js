import React from 'react';
import classNames from 'classnames';
import { renderCardletList } from '../Cardlet';

function CardletsModeBody({ visited, cardlets, loaded, id, isActive }) {
  let cardletList = {
    top: [],
    left: [],
    right: [],
    bottom: []
  };

  if (visited) {
    cardletList = cardlets || {};
  }

  const cardClassNames = classNames('card-mode-body', { hidden: !isActive });

  const contentClassNames = classNames('card-details-mode-body', {
    active: loaded,
    'not-active': !loaded
  });

  const loadingClassNames = classNames('card-details-mode-body', 'loading-overlay', {
    active: !loaded,
    'not-active': loaded
  });

  return (
    <div id={`card-mode-${id}`} className={cardClassNames}>
      <div className={loadingClassNames}>
        <div className="loading-container">
          <div className="loading-indicator" />
        </div>
      </div>
      <div className={contentClassNames}>
        {renderCardletList(cardletList['top'])}
        <div className="yui-gc">
          <div className="yui-u first">{renderCardletList(cardletList['left'])}</div>
          <div className="yui-u">{renderCardletList(cardletList['right'])}</div>
        </div>
        {renderCardletList(cardletList['bottom'])}
      </div>
    </div>
  );
}

export default CardletsModeBody;
