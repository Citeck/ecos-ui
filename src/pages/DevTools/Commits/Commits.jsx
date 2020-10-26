import React, { useContext, useEffect } from 'react';

import Select from '../../../components/common/form/Select/Select';
import { t } from '../../../helpers/util';

import { ALL_REPOS } from './constants';
import { CommitsContext } from './CommitsContext';
import CommitsGrid from './CommitsGrid';

const CommitsTab = () => {
  const context = useContext(CommitsContext);
  const { state, getCommitsInfo } = context;
  const { repos, repo } = state;

  useEffect(() => {
    getCommitsInfo();
  }, []);

  const onSelect = value => {
    console.log('value', value);
  };

  const allReposLabel = t('dev-tools.commits.all-repos');
  const options = [
    {
      id: ALL_REPOS,
      label: allReposLabel
    }
  ].concat(Object.keys(repos).map(id => repos[id]));

  return (
    <>
      <Select
        options={options}
        getOptionLabel={option => option.label}
        getOptionValue={option => option.id}
        value={options.find(item => item.id === repo)}
        onChange={onSelect}
        isSearchable={false}
        className={'select_narrow select_width_full'}
      />
      <CommitsGrid />
    </>
  );
};

export default CommitsTab;
