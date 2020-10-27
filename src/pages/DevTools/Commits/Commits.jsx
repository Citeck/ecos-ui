import React, { useContext, useEffect } from 'react';
import { Row, Col } from 'reactstrap';

import Select from '../../../components/common/form/Select/Select';
import { t } from '../../../helpers/util';

import { ALL_REPOS } from './constants';
import { CommitsContext } from './CommitsContext';
import CommitsGrid from './CommitsGrid';
import Loader from '../Loader/Loader';
import ErrorText from '../ErrorText/ErrorText';

const CommitsTab = () => {
  const context = useContext(CommitsContext);
  const { state, getCommitsInfo, selectRepo } = context;
  const { isReady, error, repos, repo } = state;

  useEffect(() => {
    getCommitsInfo();
  }, []);

  if (!isReady) {
    return <Loader />;
  } else if (error) {
    return <ErrorText>{error}</ErrorText>;
  }

  const allReposLabel = t('dev-tools.commits.all-repos');
  const options = [
    {
      repo: ALL_REPOS,
      label: allReposLabel
    },
    ...Object.keys(repos).map(id => repos[id])
  ];

  const _selectRepo = option => {
    selectRepo(option.repo);
  };

  return (
    <>
      <Row>
        <Col sm={6} md={4} lg={3}>
          <Select
            options={options}
            getOptionLabel={option => option.label}
            getOptionValue={option => option.repo}
            value={options.find(item => item.repo === repo)}
            onChange={_selectRepo}
            isSearchable={false}
            className={'select_narrow'}
          />
        </Col>
      </Row>
      <CommitsGrid />
    </>
  );
};

export default CommitsTab;
