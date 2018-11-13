import React from 'react';
// import {utils as CiteckUtils} from 'js/citeck/modules/utils/citeck';
import { setURLParameter } from '../../helpers/citeck';

import SurfRegion from '../surf/surf-region';
// import ShareFooter from "../../footer/share-footer";
import { connect } from 'react-redux';

import { setCardMode, fetchCardletData } from '../../actions/card-details';

const Alfresco = window.Alfresco;

function CardDetailsImpl(props) {
  let pageArgs = props.pageArgs;

  let createUploaderRegion = function(id) {
    return (
      <SurfRegion
        key={`uploader-${id}`}
        args={{
          regionId: id,
          scope: 'template',
          templateId: 'card-details',
          cacheAge: 1000
        }}
      />
    );
  };

  const headerComponent = (
    <SurfRegion
      args={{
        regionId: 'share-header',
        scope: 'global',
        chromeless: 'true',
        pageid: 'card-details',
        site: pageArgs.site,
        theme: pageArgs.theme,
        cacheAge: 300,
        userName: props.userName
      }}
    />
  );

  let uploadersComponents = [];

  if (props.anyCardModeLoaded) {
    uploadersComponents = [createUploaderRegion('dnd-upload'), createUploaderRegion('file-upload')];
  }

  return (
    <div id="card-details-container">
      <div key="card-details-body" className="sticky-wrapper">
        <div id="doc3">
          <div id="alf-hd">{headerComponent}</div>
          <div id="bd">
            <CardletsBodyView {...props} />
          </div>
          <div id="card-details-uploaders" style={{ display: 'none' }}>
            {uploadersComponents}
          </div>
        </div>
        <div className="sticky-push" />
      </div>
      {/*<ShareFooter key="card-details-footer" className="sticky-footer" theme={pageArgs.theme} />*/}
    </div>
  );
}

const CardDetails = connect((state, ownProps) => {
  return {
    ...ownProps,
    anyCardModeLoaded: !!(state.cardDetails.modesLoadingState || {})['any']
  };
})(CardDetailsImpl);

export default CardDetails;

/*======CARDLETS_BODY=======*/

function CardletsBody(props) {
  let modes = props.modes;
  let cardlets = props.cardlets;

  return (
    <div className="cardlets-body">
      {createCardlets(cardlets['all']['top'])}
      <div id="card-details-tabs" className="header-tabs">
        {modes.map(mode => {
          return <CardletsModeTabView key={`card-mode-link-${mode.id}`} {...mode} />;
        })}
      </div>
      <div>
        {modes.map(mode => {
          return <CardletsModeBodyView key={`card-mode-body-${mode.id}`} {...mode} cardlets={cardlets[mode.id]} />;
        })}
      </div>
    </div>
  );
}

const cardletsBodyMapProps = state => {
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

const CardletsBodyView = connect(cardletsBodyMapProps)(CardletsBody);

/*======CARDLETS_BODY=======*/

/*====CARDLETS_MODE_TAB=====*/

function CardletsModeTab(props) {
  let className = 'header-tab';

  if (props.isActive) {
    className += ' current';
  }

  return (
    <span className={className}>
      <a onClick={props.onClick}>{props.title}</a>
    </span>
  );
}

const CardletsModeTabView = connect(
  (state, ownProps) => ownProps,
  (dispatch, ownProps) => {
    return {
      onClick: () => {
        setURLParameter('mode', ownProps.id);
        dispatch(setCardMode(ownProps.id));
      }
    };
  }
)(CardletsModeTab);

/*====CARDLETS_MODE_TAB=====*/

/*====CARDLETS_MODE_BODY====*/

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

  let contentClass = props.loaded ? 'active' : 'not-active';
  let loadingClass = props.loaded ? 'not-active' : 'active';

  return (
    <div id={`card-mode-${props.id}`} className={className}>
      <div className={`card-details-mode-body ${loadingClass} loading-overlay`}>
        <div className="loading-container">
          <div className="loading-indicator" />
        </div>
      </div>
      <div className={`card-details-mode-body ${contentClass}`}>
        {createCardlets(cardlets['top'])}
        <div className="yui-gc">
          <div className="yui-u first">{createCardlets(cardlets['left'])}</div>
          <div className="yui-u">{createCardlets(cardlets['right'])}</div>
        </div>
        {createCardlets(cardlets['bottom'])}
      </div>
    </div>
  );
}

const CardletsModeBodyView = CardletsModeBody;

/*====CARDLETS_MODE_BODY====*/

/*=========CARDLET==========*/

const Cardlet = function(props) {
  props.fetchData(props);

  let loaded = props.modeLoaded && props.cardletState.data && props.controlClass;

  if (!loaded) {
    return <div />;
  } else {
    return (
      <div className="cardlet" data-available-in-mobile={props.mobileOrder > -1} data-position-index-in-mobile={props.mobileOrder}>
        <props.controlClass {...props.cardletState} />
      </div>
    );
  }
};

const evalExpRegexp = /\${((?:(?!\${)[\S\s])+?)}/g;

const cardletMapProps = (state, ownProps) => {
  let nodeRef = state.cardDetails.pageArgs.nodeRef;
  let theme = state.cardDetails.pageArgs.theme;

  let rawProps = ownProps.control.props || {};
  let controlProps = {};

  for (let prop in rawProps) {
    controlProps[prop] = rawProps[prop].replace(evalExpRegexp, (match, expr) => {
      if (expr === 'nodeRef') {
        return nodeRef;
      } else if (expr === 'theme') {
        return theme;
      }
      try {
        // eslint-disable-next-line
        return eval(expr);
      } catch (e) {
        console.error(e);
        return expr;
      }
    });
  }
  let modesLoadingState = state.cardDetails.modesLoadingState || {};
  let cardletState = (state.cardDetails.cardletsState || {})[ownProps.id] || {};
  let controlClass = ((state.cardDetails.controls || {})[ownProps.control.url] || {}).controlClass;

  return {
    ...ownProps,
    modeLoaded: ownProps.cardMode === 'all' || !!modesLoadingState[ownProps.cardMode],
    cardletState,
    controlProps,
    controlClass,
    nodeRef,
    nodeInfo: state.cardDetails.nodes[nodeRef]
  };
};

const cardletMapDispatch = dispatch => {
  return {
    fetchData: props => dispatch(fetchCardletData(props))
  };
};

const CardletView = connect(
  cardletMapProps,
  cardletMapDispatch
)(Cardlet);
const createCardlets = cardlets => (cardlets || []).map((data, idx) => <CardletView key={idx} {...data} />);

/*=========CARDLET==========*/
