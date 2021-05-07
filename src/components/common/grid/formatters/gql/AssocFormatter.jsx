import React from 'react';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { isNodeRef } from '../../../../../helpers/util';
import Records from '../../../../../components/Records';
import { AssocEditor, AssocOrgstructEditor } from '../../editors';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import { createDocumentUrl } from '../../../../../helpers/urls';
import PageService from '../../../../../services/PageService';

export default class AssocFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `.atts(n:"${attribute}"){disp,assoc}`;
  }

  static getEditor(editorProps, value, row, column) {
    if (column.type === 'assoc') {
      return <AssocEditor {...editorProps} value={value} column={column} />;
    }

    return <AssocOrgstructEditor {...editorProps} value={value} column={column} />;
  }

  static getFilterValue(cell) {
    cell = get(cell, '[0]') || cell;
    return get(cell, 'disp', '');
  }

  static async getDisplayName(item) {
    if (isNodeRef(item)) {
      return Records.get(item).load('.disp');
    }

    if (typeof item === 'string') {
      return Promise.resolve(item);
    }

    if (item && item.disp) {
      return Promise.resolve(item.disp);
    }

    return Promise.resolve('');
  }

  static getDisplayText(value) {
    if (Array.isArray(value)) {
      return Promise.all(value.map(AssocFormatter.getDisplayName)).then(results => results.join(', '));
    }

    return AssocFormatter.getDisplayName(value);
  }

  getId(cell) {
    return get(cell, 'assoc', '');
  }

  state = {
    displayName: '',
    isNeededTooltip: false
  };

  fetchName = false;

  componentDidMount() {
    const { cell } = this.props;

    this.fetchName = true;
    AssocFormatter.getDisplayText(cell).then(displayName => {
      if (this.fetchName) {
        this.setState({ displayName });
        this.fetchName = false;
      }
    });
  }

  componentWillUnmount() {
    this.fetchName = false;
  }

  renderTooltipContent = () => {
    const { cell } = this.props;
    const { displayName } = this.state;
    const displayNameArray = displayName.split(', ');

    if (isEmpty(displayName) || isEmpty(displayNameArray)) {
      return null;
    }

    return (
      <div className="ecos-formatter-assoc__tooltip-content">
        {displayNameArray.map((name, i) => (
          <div key={`${get(cell, 'assoc', '')}_${i}`}>{name}</div>
        ))}
      </div>
    );
  };

  renderDisp = () => {
    const { displayName } = this.state;
    const { cell, params } = this.props;

    if (!get(params, 'asLink')) {
      return displayName;
    }

    const link = createDocumentUrl(cell);
    const handler = e => {
      e.preventDefault();
      PageService.changeUrlLink(link, { openNewTab: !params.openInBackground, ...params });
    };

    return (
      <a href={link} onClick={handler}>
        {displayName}
      </a>
    );
  };

  onResize = () => {
    const tool = this.tooltipRef.current;

    tool && tool.runUpdate();
  };

  render() {
    const { displayName } = this.state;

    return (
      <this.PopperWrapper text={displayName} contentComponent={this.renderTooltipContent()}>
        {this.renderDisp()}
      </this.PopperWrapper>
    );
  }
}
