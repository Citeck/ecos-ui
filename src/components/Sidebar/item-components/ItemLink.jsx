import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React from 'react';

import { WorkspaceApi } from '@/api/workspaces';
import { SourcesId } from '@/constants';
import { getWorkspaceId } from '@/helpers/urls';
import SS from '@/services/sidebar';

class ItemLink extends React.PureComponent {
  wsApi = new WorkspaceApi();

  state = {
    currentWorkspaceAttributes: null,
    extraFields: null
  };

  static propTypes = {
    className: PropTypes.string,
    data: PropTypes.object,
    extraParams: PropTypes.object,
    handleClick: PropTypes.func
  };

  static defaultProps = {
    className: '',
    data: {},
    extraParams: {},
    handleClick: () => {}
  };

  componentDidMount() {
    this.updateWorkspaceInfo();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const configUrl = get(this.props, 'data.config.url');

    if (!isEqual(get(prevProps, 'data.config.url'), configUrl)) {
      this.updateWorkspaceInfo();
    }
  }

  updateWorkspaceInfo = () => {
    const configUrl = get(this.props, 'data.config.url');
    const extraFields = this.extractTemplateVars(configUrl).reduce((prev, value) => ({ ...prev, [value]: value }), {});
    this.wsApi.getWorkspace(`${SourcesId.WORKSPACE}@${getWorkspaceId()}`, extraFields).then(currentWorkspaceAttributes => {
      this.setState({ currentWorkspaceAttributes, extraFields });
    });
  };

  extractTemplateVars(str) {
    const re = /\$\{([^}]+)\}/g;
    const result = [];
    let m;
    while ((m = re.exec(str)) !== null) {
      result.push(m[1]);
    }

    return Array.from(new Set(result));
  }

  render() {
    const { children, data, extraParams, handleClick, ...props } = this.props;
    const { currentWorkspaceAttributes, extraFields } = this.state;

    if (isEmpty(data)) {
      return null;
    }

    let { targetUrl, attributes } = SS.getPropsUrl(data, extraParams);

    if (extraFields && currentWorkspaceAttributes) {
      Object.keys(extraFields).forEach(key => {
        if (targetUrl) {
          targetUrl = targetUrl?.replaceAll(`$\{${key}}`, currentWorkspaceAttributes[key] || '');
        }
      });
    }

    return (
      <a
        href={targetUrl}
        {...attributes}
        {...props}
        disabled={!targetUrl}
        className="ecos-sidebar-item__link"
        onClick={() => {
          isFunction(handleClick) && handleClick(data.id);
        }}
      >
        {children}
      </a>
    );
  }
}

export default ItemLink;
