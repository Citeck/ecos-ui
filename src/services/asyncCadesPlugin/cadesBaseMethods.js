////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NOTE Class create
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @description объект для создания асинхроннного/синхранного объекта методом cadesplugin
 */
class CadesBaseMethods {
  /**
   * @param {Object} args объект инициализирующих значений
   * @description метод-конструктор
   */
  constructor(args) {
    this.O_STORE = args.O_STORE;
    this.O_ATTS = args.O_ATTS;
    this.O_SIGNED_DATA = args.O_SIGNED_DATA;
    this.O_SIGNER = args.O_SIGNER;
    this.O_SIGNED_XML = args.O_SIGNED_XML;
    this.O_ABOUT = args.O_ABOUT;
    this.O_RAW_SIGNATURE = args.O_RAW_SIGNATURE;
    this.O_HASHED_DATA = args.O_HASHED_DATA;
  }

  /**
   * @async
   * @method createObject
   * @param {String} method
   * @returns {Method}
   * @description выбирает доступный метод для текущего браузера
   */
  async createObject(method) {
    const supportedMethod = (await window.cadesplugin.CreateObject) ?
      await window.cadesplugin.CreateObject(method) :
      await window.cadesplugin.CreateObjectAsync(method);

    return supportedMethod;
  }

  /**
   * @method oStore
   * @returns {Object}
   * @description возвращает созданный объект
   */
  oStore() {
    return this.createObject(this.O_STORE);
  }

  /**
   * @method oAtts
   * @returns {Object}
   * @description возвращает созданный объект
   */
  oAtts() {
    return this.createObject(this.O_ATTS);
  }

  /**
   * @method oSignedData
   * @returns {Object}
   * @description возвращает созданный объект
   */
  oSignedData() {
    return this.createObject(this.O_SIGNED_DATA);
  }

  /**
   * @method oSigner
   * @returns {Object}
   * @description возвращает созданный объект
   */
  oSigner() {
    return this.createObject(this.O_SIGNER);
  }

  /**
   * @method oSignedXml
   * @returns {Object}
   * @description возвращает созданный объект
   */
  oSignedXml() {
    return this.createObject(this.O_SIGNED_XML);
  }

  /**
   * @method oAbout
   * @returns {Object}
   * @description возвращает созданный объект
   */
  oAbout() {
    return this.createObject(this.O_ABOUT);
  }

  /**
   * @method oRawSignature
   * @returns {Object}
   * @description возвращает созданный объект
   */
  oRawSignature() {
    return this.createObject(this.O_RAW_SIGNATURE);
  }

  /**
   * @method oAbout
   * @returns {Object}
   * @description возвращает созданный объект
   * @see http://cpdn.cryptopro.ru/?url=/content/cades/class_c_ad_e_s_c_o_m_1_1_c_p_signers.html
   */
  oHashedData() {
    return this.createObject(this.O_HASHED_DATA);
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NOTE Exports
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default CadesBaseMethods;
