import React from 'react';
import { connect } from 'react-redux';
import SurfRegion from '../SurfRegion/SurfRegion';
import CardletsBody from './CardletsBody';
import TopPanel from './TopPanel';

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

class CardDetails extends React.Component {
  componentDidMount() {
    import('./card-details.css');
  }

  render() {
    const { anyCardModeLoaded } = this.props;

    let uploadersComponents = [];
    if (anyCardModeLoaded) {
      uploadersComponents = [createUploaderRegion('dnd-upload'), createUploaderRegion('file-upload')];
    }

    return (
      <div id="card-details-container">
        <div id="doc3">
          <div id="bd">
            <TopPanel />
            <CardletsBody />
          </div>
          <div id="card-details-uploaders" style={{ display: 'none' }}>
            {uploadersComponents}
          </div>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(CardDetails);
