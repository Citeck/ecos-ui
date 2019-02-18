import React, { Fragment } from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class PercentFormatter extends DefaultGqlFormatter {
  // multiple(singleFormatter) {
  //   return function(elCell, oRecord, oColumn, sData) {
  //     if(YAHOO.lang.isArray(sData)) {
  //       var texts = [];
  //       for(var i = 0, ii = sData.length; i < ii; i++) {
  //         singleFormatter(elCell, oRecord, oColumn, sData[i]);
  //         texts[i] = elCell.innerHTML;
  //       }
  //       elCell.innerHTML = texts.reduce(function (resultStr, text) {
  //         return resultStr += (resultStr && text ? ", " : "") + text;
  //       }, "");
  //     } else {
  //       singleFormatter(elCell, oRecord, oColumn, sData);
  //     }
  //   };
  // }
  //
  // percent () {
  //   return this.valueStrFormatter(true, function(elCell, oRecord, oColumn, sData) {
  //     if (sData == null) {
  //       elCell.innerHTML = '';
  //     } else {
  //       elCell.innerHTML = (100 * sData) + "%";
  //     }
  //   });
  // }
  //
  // valueStrFormatter(multiple, formatter) {
  //
  //   var single = function (elCell, oRecord, oColumn, oData) {
  //     var value = oData;
  //     if (_.isArray(value)) {
  //       value = value.length ? value[0] : null;
  //     }
  //     if (value) {
  //       value = value.hasOwnProperty('str') ? value.str : value;
  //     }
  //     if (formatter) {
  //       formatter(elCell, oRecord, oColumn, value);
  //     } else {
  //       elCell.innerHTML = value || "";
  //     }
  //   };
  //
  //   if (multiple) {
  //     return this.multiple(single);
  //   } else {
  //     return single;
  //   }
  // }

  render() {
    let props = this.props;
    let { cell } = props;

    if (cell) {
      cell = 100 * cell + '%';
    }

    return <Fragment>{this.value(cell)}</Fragment>;
  }
}
