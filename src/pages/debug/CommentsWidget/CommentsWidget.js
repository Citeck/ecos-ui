import React from 'react';
import Comments from '../../../components/Comments/Comments';

class DocPreviewPage extends React.Component {
  render() {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          margin: '50px 0'
        }}
      >
        <div style={{ width: '500px' }}>
          <Comments id="workspace://SpacesStore/291bd833-6e27-4865-8416-25d584404c3e" />
        </div>
        <div style={{ width: '30%' }}>
          <Comments id="workspace://SpacesStore/ee6eb89a-b15c-453c-adb5-ee55ec42aec9" />
        </div>
      </div>
    );
  }
}

export default DocPreviewPage;
