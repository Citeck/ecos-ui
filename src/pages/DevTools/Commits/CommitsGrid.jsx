import React, { useContext } from 'react';

import DevToolsConverter from '../../../dto/devTools';

import { ALL_REPOS } from './constants';
import { CommitsContext } from './CommitsContext';

const CommitsGrid = () => {
  const context = useContext(CommitsContext);
  const { state } = context;
  const { repo, commits } = state;

  const repoCommits = repo === ALL_REPOS ? { ...commits } : { ...commits.filter(commit => commit.repo === repo) };
  const data = repoCommits;

  return (
    <>
      <pre>{JSON.stringify(data, null, '\t')}</pre>
    </>
  );
};

export default CommitsGrid;
