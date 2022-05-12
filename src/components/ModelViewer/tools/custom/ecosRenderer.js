import get from 'lodash/get';

import { getLineTemplate, getPointTemplate } from './ecosTemplates';

/** @namespace HM_Renderer */

const Canvas2dRenderer = (function Canvas2dRendererClosure() {
  const _getColorPalette = function(config) {
    const gradientConfig = config.gradient || config.defaultGradient;
    const paletteCanvas = document.createElement('canvas');
    const paletteCtx = paletteCanvas.getContext('2d');

    paletteCanvas.width = 256;
    paletteCanvas.height = 1;

    const gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);

    for (let key in gradientConfig) {
      if (gradientConfig.hasOwnProperty(key)) {
        gradient.addColorStop(+key, gradientConfig[key]);
      }
    }

    paletteCtx.fillStyle = gradient;
    paletteCtx.fillRect(0, 0, 256, 1);

    return paletteCtx.getImageData(0, 0, 256, 1).data;
  };

  /**
   * Prepare Data
   * @param {HM_InternalData} dataArg
   * @returns {HM_DrawData}
   * @private
   */
  const _prepareData = function(dataArg) {
    /** @type Array<HM_Point> */
    const renderData = [];

    const min = dataArg.min;
    const max = dataArg.max;
    const radi = dataArg.radi;
    const data = dataArg.data;
    const lines = dataArg.lines;

    const xValues = Object.keys(data);

    let xValuesLen = xValues.length;

    while (xValuesLen--) {
      const x = +xValues[xValuesLen];
      const yValues = Object.keys(data[x]);
      let yValuesLen = yValues.length;

      while (yValuesLen--) {
        const y = +yValues[yValuesLen];
        const value = data[x][y];
        const radius = radi[x][y];
        const line = get(lines, [x, y]);

        renderData.push({ x, y, value, radius, line });
      }
    }

    return {
      min: min,
      max: max,
      data: renderData
    };
  };

  function Canvas2dRenderer(config) {
    const container = config.container;
    const shadowCanvas = (this.shadowCanvas = document.createElement('canvas'));
    const canvas = (this.canvas = config.canvas || document.createElement('canvas'));
    this._renderBoundaries = [10000, 10000, 0, 0];

    const computed = getComputedStyle(config.container) || {};

    canvas.className = 'heatmap-canvas';

    this._width = canvas.width = shadowCanvas.width = config.width || +computed.width.replace(/px/, '');
    this._height = canvas.height = shadowCanvas.height = config.height || +computed.height.replace(/px/, '');

    this.shadowCtx = shadowCanvas.getContext('2d');
    this.ctx = canvas.getContext('2d');

    // @TODO:
    // conditional wrapper

    canvas.style.cssText = shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;';

    container.style.position = 'relative';
    container.appendChild(canvas);

    this._palette = _getColorPalette(config);
    this._templates = {};

    this._setStyles(config);
  }

  Canvas2dRenderer.prototype = {
    renderPartial: function(data) {
      if (data.data.length > 0) {
        this._drawAlpha(data);
        this._colorize();
      }
    },
    /**
     * @param {HM_InternalData} data
     */
    renderAll: function(data) {
      // reset render boundaries
      this._clear();

      if (data.data.length > 0) {
        this._drawAlpha(_prepareData(data));
        this._colorize();
      }
    },
    _updateGradient: function(config) {
      this._palette = _getColorPalette(config);
    },
    /**
     * Update Config
     * @param {HM_Config} config
     */
    updateConfig: function(config) {
      if (config.gradient) {
        this._updateGradient(config);
      }
      this._setStyles(config);
    },
    setDimensions: function(width, height) {
      this._width = width;
      this._height = height;
      this.canvas.width = this.shadowCanvas.width = width;
      this.canvas.height = this.shadowCanvas.height = height;
    },
    _clear: function() {
      this.shadowCtx.setTransform(1, 0, 0, 1, 0, 0);
      this.shadowCtx.clearRect(0, 0, this._width, this._height);
      this.ctx.clearRect(0, 0, this._width, this._height);
    },
    _setStyles: function(config) {
      this._blur = config.blur === 0 ? 0 : config.blur || config.defaultBlur;

      if (config.backgroundColor) {
        this.canvas.style.backgroundColor = config.backgroundColor;
      }

      this._width = this.canvas.width = this.shadowCanvas.width = config.width || this._width;
      this._height = this.canvas.height = this.shadowCanvas.height = config.height || this._height;

      this._opacity = (config.opacity || 0) * 255;
      this._maxOpacity = (config.maxOpacity || config.defaultMaxOpacity) * 255;
      this._minOpacity = (config.minOpacity || config.defaultMinOpacity) * 255;
      this._useGradientOpacity = !!config.useGradientOpacity;
    },
    /**
     * Drawing Elements
     * @param dataArg {HM_DrawData}
     * @private
     */
    _drawAlpha: function(dataArg) {
      this.shadowCtx.setTransform(this.scale, 0, 0, this.scale, -this.scale * this.offsetX, -this.scale * this.offsetY);

      const min = (this._min = dataArg.min);
      const max = (this._max = dataArg.max);
      const data = dataArg.data || [];
      let dataLen = data.length;
      // on a point basis?
      const blur = 1 - this._blur;

      while (dataLen--) {
        /** @type {HM_Point} */
        const point = data[dataLen];
        const x = point.x;
        const y = point.y;
        const radius = point.radius;
        // if value is bigger than max
        // use max as value
        const value = Math.min(point.value, max);
        const rectX = point.line ? x : x - radius;
        const rectY = point.line ? y : y - radius;
        const shadowCtx = this.shadowCtx;

        const keyTemp = point.line ? JSON.stringify(point.line) : radius;

        let tpl;

        if (this._templates[keyTemp]) {
          tpl = this._templates[keyTemp];
        } else {
          if (point.line) {
            tpl = getLineTemplate(point.line, radius, blur);
          } else {
            tpl = getPointTemplate(radius, blur);
          }

          this._templates[keyTemp] = tpl;
        }

        // value from minimum / value range
        // => [0, 1]
        const templateAlpha = (value - min) / (max - min);
        // this fixes #176: small values are not visible because globalAlpha < .01 cannot be read from imageData
        shadowCtx.globalAlpha = templateAlpha < 0.01 ? 0.01 : templateAlpha;

        shadowCtx.drawImage(tpl, rectX, rectY);

        // comment this part because we now ignore this boundaries
        // update renderBoundaries
        /*        if (rectX < this._renderBoundaries[0]) {
          this._renderBoundaries[0] = rectX;
        }
        if (rectY < this._renderBoundaries[1]) {
          this._renderBoundaries[1] = rectY;
        }
        if (rectX + 2 * radius > this._renderBoundaries[2]) {
          this._renderBoundaries[2] = rectX + 2 * radius;
        }
        if (rectY + 2 * radius > this._renderBoundaries[3]) {
          this._renderBoundaries[3] = rectY + 2 * radius;
        }*/
      }
      // todo: not optimal but may be fixed later
      this._renderBoundaries[0] = 0;
      this._renderBoundaries[1] = 0;
      this._renderBoundaries[2] = this._width;
      this._renderBoundaries[3] = this._height;
    },
    _colorize: function() {
      let x = this._renderBoundaries[0];
      let y = this._renderBoundaries[1];
      let width = this._renderBoundaries[2] - x;
      let height = this._renderBoundaries[3] - y;

      const maxWidth = this._width;
      const maxHeight = this._height;
      const opacity = this._opacity;
      const maxOpacity = this._maxOpacity;
      const minOpacity = this._minOpacity;
      const useGradientOpacity = this._useGradientOpacity;

      if (x < 0) {
        x = 0;
      }
      if (y < 0) {
        y = 0;
      }
      if (x + width > maxWidth) {
        width = maxWidth - x;
      }
      if (y + height > maxHeight) {
        height = maxHeight - y;
      }

      const img = this.shadowCtx.getImageData(x, y, width, height);
      const imgData = img.data;
      const len = imgData.length;
      const palette = this._palette;

      for (let i = 3; i < len; i += 4) {
        const alpha = imgData[i];
        const offset = alpha * 4;

        if (!offset) {
          continue;
        }

        let finalAlpha;
        if (opacity > 0) {
          finalAlpha = opacity;
        } else {
          if (alpha < maxOpacity) {
            if (alpha < minOpacity) {
              finalAlpha = minOpacity;
            } else {
              finalAlpha = alpha;
            }
          } else {
            finalAlpha = maxOpacity;
          }
        }

        imgData[i - 3] = palette[offset];
        imgData[i - 2] = palette[offset + 1];
        imgData[i - 1] = palette[offset + 2];
        imgData[i] = useGradientOpacity ? palette[offset + 3] : finalAlpha;
      }

      //img.data = imgData;
      this.ctx.putImageData(img, x, y);

      this._renderBoundaries = [1000, 1000, 0, 0];
    },
    getValueAt: function(point) {
      const shadowCtx = this.shadowCtx;
      const img = shadowCtx.getImageData(point.x, point.y, 1, 1);
      const data = img.data[3];
      const max = this._max;
      const min = this._min;

      return (Math.abs(max - min) * (data / 255)) >> 0;
    },
    getDataURL: function() {
      return this.canvas.toDataURL();
    },
    setOffsetAndScale: function(x, y, scale) {
      this.offsetX = x;
      this.offsetY = y;
      this.scale = scale;
    }
  };

  return Canvas2dRenderer;
})();

export default Canvas2dRenderer;
