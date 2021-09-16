import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import uniqueId from 'lodash/uniqueId';

import { InfoText, Loader, Separator, Tooltip } from '../../common/index';
import { t } from '../../../helpers/util';

class ActionsList extends React.Component {
  countList = uniqueId('list-');

  static propTypes = {
    list: PropTypes.array,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool,
    isActiveLayout: PropTypes.bool,
    executeAction: PropTypes.func,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })])
  };

  static defaultProps = {
    list: [],
    isMobile: false,
    isLoading: false,
    executeAction: () => null
  };

  getPureList() {
    const { list } = this.props;

    if (Array.isArray(list)) {
      let withoutThis = [...list];

      return list.filter(a => {
        withoutThis.shift();
        return !withoutThis.some(b => isEqual(a, b));
      });
    }

    return [];
  }

  onClick = action => {
    const { executeAction, isLoading } = this.props;

    if (!isLoading) {
      executeAction(action);
    }
  };

  renderVariant = (action, variant, postfix) => {
    const { isLoading, isActiveLayout } = this.props;
    const id = `variant-${variant.type}-${postfix}`;
    const variantAction = Object.assign({}, action, variant);

    return (
      <Tooltip showAsNeeded uncontrolled key={id} target={id} text={variant.name} off={!isActiveLayout}>
        <div
          id={id}
          className={classNames('ecos-actions-list__item-variants__item', {
            'ecos-actions-list__item-variants__item_disabled': isLoading
          })}
          onClick={() => this.onClick(variantAction)}
        >
          {variant.name}
        </div>
      </Tooltip>
    );
  };

  render() {
    const { isLoading, list = [], isMobile, forwardedRef, isActiveLayout } = this.props;

    return (
      <div className="ecos-actions-list" ref={forwardedRef}>
        {isLoading && <Loader className="ecos-actions-list__loader" blur />}
        {!isLoading && isEmpty(list) && <InfoText className="ecos-actions-list__text-empty" text={t('records-actions.no-available')} />}
        {this.getPureList().map((action = {}, index) => {
          const hasVariants = !isEmpty(action.variants);
          const weight = JSON.stringify(action).length;
          const id = `action-${this.countList}-${action.id}-${action.type}-${weight}`;

          return (
            <div
              key={id}
              className={classNames(
                'ecos-actions-list__item',
                { 'ecos-actions-list__item_group': hasVariants },
                { 'ecos-actions-list__item_disabled': isLoading },
                { 'ecos-actions-list__item_warning': action.theme }
              )}
              onClick={() => (hasVariants ? null : this.onClick(action))}
            >
              <Tooltip showAsNeeded uncontrolled target={id} text={action.name} off={!isActiveLayout}>
                <div id={id} className="ecos-actions-list__item-title">
                  {action.name}
                </div>
              </Tooltip>
              {hasVariants && (
                <div className="ecos-actions-list__item-variants">
                  {action.variants.map((variant, position) => this.renderVariant(action || {}, variant || {}, `${id}-${position}`))}
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
