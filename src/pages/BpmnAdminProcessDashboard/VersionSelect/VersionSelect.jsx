import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import React, { useEffect, useContext } from 'react';
import { connect } from 'react-redux';

import { getAllVersions } from '../../../actions/processAdmin';
import { Loader } from '../../../components/common';
import { Select } from '../../../components/common/form';
import { t } from '../../../helpers/util';
import { selectProcessMetaInfo, selectProcessVersions } from '../../../selectors/processAdmin';
import { ProcessContext } from '../ProcessContext';
import { getValue } from '../utils';

import './style.scss';

const ProcessHeader = ({ processId, metaInfo, versions, getAllVersions }) => {
  const { selectedVersion, setSelectedVersion } = useContext(ProcessContext);

  useEffect(() => {
    if (metaInfo && metaInfo.key && !versions.loading && !versions.data) {
      isFunction(getAllVersions) && getAllVersions(processId, metaInfo.key);
    }
  }, [metaInfo, versions]);

  useEffect(() => {
    if (metaInfo && selectedVersion === null) {
      if (metaInfo.version || metaInfo.innerVersion) {
        setSelectedVersion(metaInfo);
      }
    }
  }, [metaInfo, selectedVersion]);

  const showLoader = !versions || (versions && versions.loading) || (versions && !versions.data);

  const getLabel = option => {
    const version = option.version ? option.version : `${option.innerVersion} - ${t('bpmn-admin.inner-version')} `;

    return `${version} (${get(option, 'statistics.instancesCount', 0)}/${get(option, 'statistics.incidentCount', 0)})`;
  };

  const handleChange = option => {
    setSelectedVersion(option);
  };

  return (
    <div className="process-header">
      {showLoader && <Loader type="points" />}
      {!showLoader && (
        <Select
          className="process-header__select"
          options={versions.data}
          value={selectedVersion}
          onChange={handleChange}
          getOptionLabel={getLabel}
          getOptionValue={getValue}
          menuPlacement="auto"
        />
      )}
    </div>
  );
};

const mapStateToProps = (store, props) => {
  return {
    metaInfo: selectProcessMetaInfo(store, props),
    versions: selectProcessVersions(store, props)
  };
};

const mapDispatchToProps = dispatch => ({
  getAllVersions: (processId, processKey) => dispatch(getAllVersions({ processId, processKey }))
});

export default connect(mapStateToProps, mapDispatchToProps)(ProcessHeader);
