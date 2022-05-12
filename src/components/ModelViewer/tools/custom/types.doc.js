/**
 * @namespace HM_Types
 * Description of types is here
 */

/**
 * @typedef HM_InternalData
 * @type {object}
 * @property {Array} data
 * @property {Array} radi
 * @property {Array<HM_Line>} lines
 * @property {number} max
 * @property {number} min
 * @memberOf HM_Store
 */

/**
 * @typedef HM_Line
 * @type {Array<HM_LinePoint>}
 * @memberOf HM_Renderer
 */

/**
 * @typedef HM_LinePoint
 * @type {object}
 * @property {number} x
 * @property {number} y
 * @memberOf HM_Renderer
 */

/**
 * @typedef HM_Config
 * @type {object}
 * @property {object} gradient
 * @property {object} defaultGradient
 * @property {Element} container
 * @property {number} blur
 * @property {number} defaultBlur
 * @property {number} opacity
 * @property {number} maxOpacity
 * @property {number} defaultMaxOpacity
 * @property {number} minOpacity
 * @property {number} defaultMinOpacity
 * @property {boolean} useGradientOpacity
 * @memberOf HM_Store
 */

/**
 * @typedef HM_Point
 * @type {object}
 * @property {number} x
 * @property {number} y,
 * @property {number} value
 * @property {number} radius,
 * @property {HM_Line|undefined} line
 * @memberOf HM_Store
 */

/**
 * @typedef HM_DrawData
 * @type {object}
 * @property {Array<HM_Point>} data
 * @property {number} max
 * @property {number} min
 * @memberOf HM_Renderer
 */
