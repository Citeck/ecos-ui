import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import { t } from '../../../helpers/util';
import { InfoText, Loader, Separator } from '../../common/index';

class ActionsList extends React.Component {
  static propTypes = {
    list: PropTypes.array,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool,
    executeAction: PropTypes.func,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    onActionsChanged: PropTypes.func
  };

  static defaultProps = {
    list: [],
    isMobile: false,
    isLoading: false,
    executeAction: () => null
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (JSON.stringify(prevProps.list) !== JSON.stringify(this.props.list)) {
      this.props.onActionsChanged();
    }
  }

  onClick = action => {
    const { executeAction, isLoading } = this.props;

    if (!isLoading) {
      executeAction(action);
    }
  };

  render() {
    const { isLoading, list = [], isMobile, forwardedRef } = this.props;

    return (
      <div className="ecos-actions-list" ref={forwardedRef}>
        {isLoading && <Loader className="ecos-actions-list__loader" blur />}
        {!isLoading && isEmpty(list) && <InfoText className="ecos-actions-list__text-empty" text={t('records-actions.no-available')} />}
        {list.map((action, index) => {
          const hasVariants = !isEmpty(action.variants);

          return (
            <div
              key={`action-${action.type}-${index}`}
              className={classNames(
                'ecos-actions-list__item',
                { 'ecos-actions-list__item_group': hasVariants },
                { 'ecos-actions-list__item_disabled': isLoading },
                { 'ecos-actions-list__item_warning': action.theme }
              )}
              onClick={() => (hasVariants ? null : this.onClick(action))}
            >
              <div className="ecos-actions-list__item-title">{action.name}</div>
              {hasVariants && (
                <div className="ecos-actions-list__item-variants">
                  {!isEmpty(action.variants) &&
                    action.variants.map(variant => (
                      <div
                        key={`action-${action.type}-${index}-${variant.type}`}
                        className={classNames('ecos-actions-list__item-variants__item', {
                          'ecos-actions-list__item-variants__item_disabled': isLoading
                        })}
                        onClick={() => this.onClick(action)}
                      >
                        {variant.name}
                      </div>
                    ))}
                </div>
              )}
              {isMobile && index < list.length - 1 && !hasVariants && <Separator noIndents />}
            </div>
          );
        })}
      </div>
    );
  }
}

export default ActionsList;
