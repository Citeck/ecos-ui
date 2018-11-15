import React from 'react';
import { connect } from 'react-redux';
import CardletsModeTab from '../CardletsModeTab';
import CardletsModeBody from '../CardletsModeBody';
import { renderCardletList } from '../Cardlet';

const Alfresco = window.Alfresco;

const CardletsBody = ({ modes, cardlets }) => (
  <div className="cardlets-body">
    {renderCardletList(cardlets['all']['top'])}
    <div id="card-details-tabs" className="header-tabs">
      {modes.map(mode => {
        return <CardletsModeTab key={`card-mode-link-${mode.id}`} {...mode} />;
      })}
    </div>
    <div>
      {modes.map(mode => {
        return <CardletsModeBody key={`card-mode-body-${mode.id}`} {...mode} cardlets={cardlets[mode.id]} />;
      })}
    </div>
  </div>
);

// TODO optimize
const mapStateToProps = state => {
  let cardlets = {
    all: { top: [] }
  };

  for (let cardlet of state.cardDetails.cardletsData.cardlets) {
    if (cardlet.id === 'card-modes') {
      continue;
    }
    let mode = cardlet.cardMode;
    let columns = cardlets[mode];
    if (!columns) {
      columns = {
        top: [],
        left: [],
        right: [],
        bottom: []
      };
      cardlets[mode] = columns;
    }
    let column = columns[cardlet.column];
    if (column) {
      column.push(cardlet);
    }
  }

  let modesLoadingState = state.cardDetails.modesLoadingState || {};
  let visitedCardModes = state.cardDetails.visitedCardModes || {};

  let modes = [
    {
      id: 'default',
      title: Alfresco.util.message('card.mode.default.title'),
      description: Alfresco.util.message('card.mode.default.description')
    },
    ...state.cardDetails.cardletsData.cardModes
  ].map(mode => {
    return {
      ...mode,
      isActive: mode.id === state.cardDetails.currentCardMode,
      visited: !!visitedCardModes[mode.id],
      loaded: !!modesLoadingState[mode.id]
    };
  });

  return {
    cardlets,
    modes
  };
};

export default connect(mapStateToProps)(CardletsBody);
