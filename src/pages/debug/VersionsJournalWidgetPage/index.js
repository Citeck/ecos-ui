import React from 'react';
import uuid from 'uuidv4';
import VersionsJournal from '../../../components/VersionsJournal';

class VersionsJournalWidgetPage extends React.Component {
  state = {
    id: uuid(),
    // record: 'workspace://SpacesStore/848e6c2a-7c08-4c95-b70c-0bcf9aa5bcfa'
    record: 'workspace://SpacesStore/32fda355-1725-4e5e-9665-7b1a487535a2'
  };

  render() {
    const { id, record } = this.state;

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          margin: '50px 0'
        }}
      >
        <div style={{ width: '80%' }}>
          <VersionsJournal id={id} record={record} />
        </div>
      </div>
    );
  }
}

export default VersionsJournalWidgetPage;
