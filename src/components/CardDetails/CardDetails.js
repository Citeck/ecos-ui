import React from 'react';
import { connect } from 'react-redux';
import SurfRegion from '../SurfRegion/SurfRegion';
import CardletsBody from './CardletsBody';
import './card-details.css';

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

const mapStateToProps = (state, ownProps) => {
  return {
    ...ownProps,
    anyCardModeLoaded: !!(state.cardDetails.modesLoadingState || {})['any']
  };
};

function CardDetails({ anyCardModeLoaded }) {
  let uploadersComponents = [];
  if (anyCardModeLoaded) {
    uploadersComponents = [createUploaderRegion('dnd-upload'), createUploaderRegion('file-upload')];
  }

  return (
    <div id="card-details-container">
      <div id="doc3">
        <div id="bd">
          <CardletsBody />
        </div>
        <div id="card-details-uploaders" style={{ display: 'none' }}>
          {uploadersComponents}
        </div>
      </div>
    </div>
  );
}

export default connect(mapStateToProps)(CardDetails);
