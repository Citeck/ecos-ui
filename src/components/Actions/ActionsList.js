import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import { t } from '../../helpers/util';
import { InfoText, Loader } from '../common';

class ActionsList extends React.Component {
  static propTypes = {
    list: PropTypes.array,
    isLoading: PropTypes.bool,
    executeAction: PropTypes.func
  };

  static defaultProps = {
    list: [],
    isLoading: false,
    executeAction: () => null
  };

  onClick = (action, index) => {
    const { executeAction } = this.props;

    if (isEmpty(action.variants)) {
      executeAction(action);
    }
  };

  renderVariants(variants) {
    const isOpen = !isEmpty(variants);

    return (
      isOpen && (
        <div className="ecos-actions-list__item-variants">
          {variants.map(variant => (
            <div className="ecos-actions-list__variant">{variant.title}</div>
          ))}
        </div>
      )
    );
  }

  render() {
    const { isLoading, list = [] } = this.props;

    if (isLoading) {
      return <Loader className="ecos-actions-list__loader" />;
    }

    if (isEmpty(list)) {
      return <InfoText text={t('Нет доступных действий')} />;
    }

    return (
      <div className="ecos-actions-list">
        {list.map((action, index) => (
          <React.Fragment key={`action-${action.id}-${index}`}>
            <div
              className={classNames('ecos-actions-list__item-title', { 'ecos-actions-list__item-title_group': !isEmpty(action.variants) })}
              onClick={() => this.onClick(action, index)}
            >
              {action.title}
            </div>
            {this.renderVariants(action.variants)}
          </React.Fragment>
        ))}
      </div>
    );
  }
}

export default ActionsList;
