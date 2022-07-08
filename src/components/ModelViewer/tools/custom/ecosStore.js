import head from 'lodash/head';
import set from 'lodash/set';
import get from 'lodash/get';

import HeatmapConfig from './HeatmapConfig';

/** @namespace HM_Store */

const Store = (function StoreClosure() {
  /**
   *
   * @param config {HM_Config}
   * @constructor
   */
  const Store = function Store(config) {
    this._coordinator = {};
    this._data = [];
    this._radi = [];
    this._lines = [];
    this._min = 10;
    this._max = 1;
    this._xField = config['xField'] || config.defaultXField;
    this._yField = config['yField'] || config.defaultYField;
    this._valueField = config['valueField'] || config.defaultValueField;

    if (config['radius']) {
      this._cfgRadius = config['radius'];
    }
  };

  const defaultRadius = HeatmapConfig.defaultRadius;

  Store.prototype = {
    // when forceRender = false -> called from setData, omits renderall event
    /**
     * @returns {boolean|HM_Point}
     * @private
     */
    _organiseData: function(dataPoint, forceRender) {
      const isLine = !!head(dataPoint.line);
      const x = (isLine ? head(dataPoint.line) : dataPoint)[this._xField];
      const y = (isLine ? head(dataPoint.line) : dataPoint)[this._yField];
      const radi = this._radi;
      const store = this._data;
      const _lines = this._lines;
      const max = this._max;
      const min = this._min;
      const value = dataPoint[this._valueField] || 1;
      const radius = dataPoint.radius || this._cfgRadius || defaultRadius;

      if (!get(store, [x, y])) {
        set(store, [x, y], value);
        set(radi, [x, y], radius);
      } else {
        store[x][y] += value;
      }

      if (isLine) {
        set(_lines, [x, y], dataPoint.line);
      }

      const storedVal = store[x][y];

      if (storedVal > max) {
        if (!forceRender) {
          this._max = storedVal;
        } else {
          this.setDataMax(storedVal);
        }

        return false;
      }

      if (storedVal < min) {
        if (!forceRender) {
          this._min = storedVal;
        } else {
          this.setDataMin(storedVal);
        }

        return false;
      }

      return { x, y, value, radius, min, max };
    },
    _unOrganizeData: function() {
      const unorganizedData = [];
      const data = this._data;
      const radi = this._radi;

      for (const x in data) {
        for (const y in data[x]) {
          unorganizedData.push({
            x,
            y,
            radius: radi[x][y],
            value: data[x][y]
          });
        }
      }
      return {
        min: this._min,
        max: this._max,
        data: unorganizedData
      };
    },
    _onExtremaChange: function() {
      this._coordinator.emit('extremachange', {
        min: this._min,
        max: this._max
      });
    },
    addData: function() {
      if (head(arguments).length > 0) {
        const dataArr = head(arguments);
        let dataLen = dataArr.length;
        while (dataLen--) {
          this.addData.call(this, dataArr[dataLen]);
        }
      } else {
        // add to store
        const organisedEntry = this._organiseData(head(arguments), true);
        if (organisedEntry) {
          // if it's the first datapoint initialize the extremas with it
          if (this._data.length === 0) {
            this._min = this._max = organisedEntry.value;
          }
          this._coordinator.emit('renderpartial', {
            min: this._min,
            max: this._max,
            data: [organisedEntry]
          });
        }
      }
      return this;
    },
    setData: function(data) {
      const dataPoints = data.data;
      const pointsLen = dataPoints.length;

      // reset data arrays
      this._data = [];
      this._radi = [];

      for (let i = 0; i < pointsLen; i++) {
        this._organiseData(dataPoints[i], false);
      }
      this._max = data.max;
      this._min = data.min || 0;

      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    removeData: function() {
      // TODO: implement
    },
    setDataMax: function(max) {
      this._max = max;
      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    setDataMin: function(min) {
      this._min = min;
      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    setCoordinator: function(coordinator) {
      this._coordinator = coordinator;
    },
    /**
     * @returns {HM_InternalData}
     * @private
     */
    _getInternalData: function() {
      return {
        max: this._max,
        min: this._min,
        data: this._data,
        radi: this._radi,
        lines: this._lines
      };
    },
    getData: function() {
      return this._unOrganizeData();
    } /*,

      TODO: rethink.

    getValueAt: function(point) {
      var value;
      var radius = 100;
      var x = point.x;
      var y = point.y;
      var data = this._data;

      if (data[x] && data[x][y]) {
        return data[x][y];
      } else {
        var values = [];
        // radial search for datapoints based on default radius
        for(var distance = 1; distance < radius; distance++) {
          var neighbors = distance * 2 +1;
          var startX = x - distance;
          var startY = y - distance;

          for(var i = 0; i < neighbors; i++) {
            for (var o = 0; o < neighbors; o++) {
              if ((i == 0 || i == neighbors-1) || (o == 0 || o == neighbors-1)) {
                if (data[startY+i] && data[startY+i][startX+o]) {
                  values.push(data[startY+i][startX+o]);
                }
              } else {
                continue;
              }
            }
          }
        }
        if (values.length > 0) {
          return Math.max.apply(Math, values);
        }
      }
      return false;
    }*/
  };

  return Store;
})();

export default Store;