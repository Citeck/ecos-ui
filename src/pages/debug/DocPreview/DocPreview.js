import React from 'react';
import DocPreviewDashlet from '../../../components/DocPreview/DocPreviewDashlet';
import DocPreview from '../../../components/DocPreview/DocPreview';

class DocPreviewPage extends React.Component {
  render() {
    return (
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ width: '857px', margin: '10px' }}>
          <DocPreviewDashlet
            id={'dashletId-1-1-2'}
            config={{
              link: 'testPdf.pdf',
              height: 700,
              scale: 0.5
            }}
            classNameDashlet={'classNameDashlet'}
            classNamePreview={'classNamePreview'}
          />
        </div>
        <div style={{ width: '50%', margin: '10px' }}>
          <DocPreviewDashlet id={'dashletId-1-1-2'} config={{ link: 'testImg.jpg', scale: 1, height: 500 }} />
        </div>
        <div style={{ width: '30%', margin: '10px' }}>
          <DocPreview link={'testImg.jpg'} />
        </div>
      </div>
    );
  }
}

export default DocPreviewPage;
