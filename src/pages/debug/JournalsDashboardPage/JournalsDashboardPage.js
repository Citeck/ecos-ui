import React, { Fragment } from 'react';
import { JournalsDashlet } from '../../../components/Journals';

export default class JournalsDashboardPage extends React.Component {
  render() {
    const id = 'dashletId-1-0-0';
    //const id2 = 'dashletId-1-0-1';

    return (
      <Fragment>
        <JournalsDashlet id={id} stateId={id} />
        {/*<br />*/}
        {/*<JournalsDashlet id={id2} stateId={id2} />*/}
      </Fragment>
    );
  }
}
