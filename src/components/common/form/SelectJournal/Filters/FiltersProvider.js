import React, { Component } from 'react';

import { getPredicateInput, getPredicates } from '../../../../Records/predicates/predicates';
import FiltersContext from './FiltersContext';

export default class FiltersProvider extends Component {
  state = {
    allFields: [],
    fields: [],
    searchText: '',
    isReady: false
  };

  componentDidMount() {
    const { columns } = this.props;
    if (columns) {
      this.setFields(columns);
    }
  }

  componentWillReceiveProps() {
    const { columns } = this.props;
    const { isReady } = this.state;

    if (columns && !isReady) {
      this.setFields(columns);
    }
  }

  setFields = fields => {
    const { sourceId, presetFilterPredicates } = this.props;

    this.setState({
      allFields: fields,
      fields: fields
        .filter(item => {
          return item.default || (Array.isArray(presetFilterPredicates) && presetFilterPredicates.find(i => item.attribute === i.att));
        })
        .map(item => {
          const predicates = getPredicates(item);
          const input = getPredicateInput(item, sourceId);

          let predicateValue = input ? input.defaultValue : null;
          let selectedPredicate = predicates[0];
          if (Array.isArray(presetFilterPredicates)) {
            const presetFilterPredicate = presetFilterPredicates.find(i => item.attribute === i.att);
            if (presetFilterPredicate) {
              predicateValue = presetFilterPredicate.val;
              selectedPredicate = predicates.find(i => i.value === presetFilterPredicate.t) || predicates[0];
            }
          }

          return {
            ...item,
            predicates,
            selectedPredicate,
            predicateValue,
            input
          };
        }),
      isReady: true
    });
  };

  addField = field => {
    const { sourceId } = this.props;

    this.setState(prevState => {
      const predicates = getPredicates(field);
      const input = getPredicateInput(field, sourceId);
      return {
        fields: [
          ...prevState.fields,
          {
            ...field,
            predicates,
            selectedPredicate: predicates[0],
            predicateValue: input ? input.defaultValue : null,
            input
          }
        ]
      };
    });
  };

  render() {
    return (
      <FiltersContext.Provider
        value={{
          allFields: this.state.allFields,
          fields: this.state.fields,
          searchText: this.state.searchText,
          updateSearchText: e => {
            this.setState({
              searchText: e.target.value
            });
          },
          addField: field => {
            this.addField(field);
          },
          removeField: e => {
            const indexToRemove = parseInt(e.target.dataset.idx);
            this.setState(prevState => {
              return {
                fields: prevState.fields.filter((_, idx) => idx !== indexToRemove)
              };
            });
          },
          changePredicate: (indexToChange, selectedPredicate) => {
            this.setState(prevState => {
              const changedElement = prevState.fields.splice(indexToChange, 1);

              return {
                fields: [
                  ...prevState.fields.slice(0, indexToChange),
                  {
                    ...changedElement[0],
                    selectedPredicate
                  },
                  ...prevState.fields.slice(indexToChange, prevState.fields.length)
                ]
              };
            });
          },
          changePredicateValue: (indexToChange, predicateValue) => {
            this.setState(prevState => {
              const changedElement = prevState.fields.splice(indexToChange, 1);

              return {
                fields: [
                  ...prevState.fields.slice(0, indexToChange),
                  {
                    ...changedElement[0],
                    predicateValue
                  },
                  ...prevState.fields.slice(indexToChange, prevState.fields.length)
                ]
              };
            });
          }
        }}
      >
        {this.props.children}
      </FiltersContext.Provider>
    );
  }
}
