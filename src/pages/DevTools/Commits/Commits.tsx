import React, { useContext, useEffect } from 'react';
import { Row, Col } from 'reactstrap';

import Select from '../../../components/common/form/Select/Select';
import { t } from '../../../helpers/util';
import ErrorText from '../ErrorText/ErrorText';
import Loader from '../Loader/Loader';

import { CommitsContext } from './CommitsContext';
import CommitsGrid from './CommitsGrid';
import { ALL_REPOS } from './constants';

export const Labels = {
  title: 'dev-tools.commits.all-repos'
};

const CommitsTab = (): React.JSX.Element => {
  const context = useContext(CommitsContext);
  const { state, getCommitsInfo, selectRepo } = context;
  const { isReady, error, repos, repo } = state;

  useEffect(() => {
    getCommitsInfo();
  }, []);

  if (error) {
    return <ErrorText>{error}</ErrorText>;
  }

  if (!isReady) {
    return <Loader />;
  }

  const options = [
    {
      repo: ALL_REPOS,
      label: t(Labels.title)
    },
    ...Object.keys(repos).map(id => repos[id])
  ];

  const _selectRepo = (option: { repo: string; label: string }) => {
    selectRepo(option.repo);
  };

  return (
    <>
      <Row>
        <Col sm={6} md={4} lg={3}>
          <Select
            options={options}
            getOptionLabel={(option: { label: string }) => option.label}
            getOptionValue={(option: { repo: string }) => option.repo}
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
