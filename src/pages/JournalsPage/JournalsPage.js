import React from 'react';
import { Journals } from '../../components/Journals';
import { JournalsUrlManager } from '../../components/Journals';

export default class JournalsPage extends React.Component {
  render() {
    return (
      <JournalsUrlManager>
        <Journals />
      </JournalsUrlManager>
    );
  }
}
