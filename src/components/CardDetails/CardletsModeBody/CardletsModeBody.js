import React from 'react';
import { renderCardletList } from '../Cardlet';

function CardletsModeBody(props) {
  let className = 'card-mode-body';
  if (!props.isActive) {
    className += ' hidden';
  }

  let cardlets = props.visited
    ? props.cardlets || {}
    : {
        top: [],
        left: [],
        right: [],
        bottom: []
      };

  let isCardletsEmpty = function(cardlets) {
    for (let space in cardlets) {
      if (cardlets.hasOwnProperty(space) && cardlets[space].length) {
        return false;
      }
    }
    return true;
  };

  let loaded = isCardletsEmpty(cardlets) || props.loaded;

  let contentClass = loaded ? 'active' : 'not-active';
  let loadingClass = loaded ? 'not-active' : 'active';

  return (
    <div id={`card-mode-${props.id}`} className={className}>
      <div className={`card-details-mode-body ${loadingClass} loading-overlay`}>
        <div className="loading-container">
          <div className="loading-indicator" />
        </div>
      </div>
      <div className={`card-details-mode-body ${contentClass}`}>
        {renderCardletList(cardlets['top'])}
        <div className="yui-gc">
          <div className="yui-u first">{renderCardletList(cardlets['left'])}</div>
          <div className="yui-u">{renderCardletList(cardlets['right'])}</div>
        </div>
        {renderCardletList(cardlets['bottom'])}
      </div>
    </div>
  );
}

export default CardletsModeBody;
