import React, { useContext } from 'react';
import moment from 'moment';

import DateTimeFormatter from '../../../components/common/grid/formatters/gql/DateTimeFormatter';
import { Grid } from '../../../components/common/grid';
import { t } from '../../../helpers/util';

import { ALL_REPOS, BITBUCKET } from './constants';
import { getRepoProject, parseTasksLinks, getHostName } from './helpers';
import { CommitsContext } from './CommitsContext';

const CommitsGrid = () => {
  const context = useContext(CommitsContext);
  const { state } = context;
  const { repo, repos, commits } = state;

  const repoCommitLink = (fullRepo, repoProject, hash) => {
    if (fullRepo.includes(getHostName(BITBUCKET))) {
      return `${BITBUCKET}${repoProject}/commits/${hash}`;
    }

    return `https://${getHostName(fullRepo)}/${repoProject}/commit/${hash}`;
  };

  const columns = [
    {
      dataField: 'author',
      text: t('dev-tools.commits.grid-column.author'),
      formatExtraData: {
        formatter: ({ cell }) => cell.name
      }
    },
    {
      dataField: 'repo',
      text: t('dev-tools.commits.grid-column.repo'),
      formatExtraData: {
        formatter: ({ cell, row }) => {
          const repoProject = getRepoProject(cell);
          const repoLabel = repos[cell].label;
          if (!repoProject) {
            return repoLabel;
          }
          return (
            <a
              href={`https://${getHostName(row.repo)}/${repoProject}`}
              target="_blank"
              rel="noopener noreferrer"
              className="commits-grid__link"
              title={cell}
            >
              {repoLabel}
            </a>
          );
        }
      }
    },
    {
      dataField: 'commit',
      text: t('dev-tools.commits.grid-column.commit'),
      formatExtraData: {
        formatter: ({ cell, row }) => {
          const shortHash = (cell || '').substr(0, 7);
          const repoProject = getRepoProject(row.repo);
          if (!repoProject) {
            return <span title={cell}>{shortHash}</span>;
          }
          return (
            <a
              target="_blank"
              href={repoCommitLink(row.repo, repoProject, cell)}
              rel="noopener noreferrer"
              className="commits-grid__link"
              title={cell}
            >
              {shortHash}
            </a>
          );
        }
      }
    },
    {
      dataField: 'committer',
      text: t('dev-tools.commits.grid-column.date'),
      formatExtraData: {
        formatter: ({ cell }) => {
          const a = moment(cell.date);
          const b = moment();
          const diff = b.diff(a, 'days');
          return (
            <DateTimeFormatter
              cell={cell}
              params={{
                cellProperty: 'date',
                relative: diff < 7,
                format: 'L'
              }}
            />
          );
        }
      }
    },
    {
      dataField: 'subject',
      text: t('dev-tools.commits.grid-column.message'),
      formatExtraData: {
        formatter: ({ cell, row }) => {
          const __html = parseTasksLinks(cell);
          let title = cell;
          if (row.body) {
            title += `\n\n${row.body}`;
          }
          return <div dangerouslySetInnerHTML={{ __html }} title={title} />;
        }
      }
    }
  ];

  const data = repo === ALL_REPOS ? [...commits] : [...commits.filter(commit => commit.repo === repo)];

  return (
    <Grid
      autoHeight
      maxHeight={'calc(100vh - 300px)'}
      fixedHeader
      data={data}
      columns={columns.filter(column => {
        if (repo === ALL_REPOS) {
          return true;
        }
        return column.dataField !== 'repo';
      })}
      className="commits-grid"
    />
  );
};

export default CommitsGrid;
