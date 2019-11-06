/*
 * Copyright (C) 2008-2015 Citeck LLC.
 *
 * This file is part of Citeck EcoS
 *
 * Citeck EcoS is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Citeck EcoS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Citeck EcoS. If not, see <http://www.gnu.org/licenses/>.
 */
/**************************************/
/*              SIGNING               */
/**************************************/

if (typeof window.EsignCache == 'undefined' || !window.EsignCache) {
  var esignCache = function() {
    var nodeRefsCache;
    var refreshCashe;
    var doCheck;
    var async_code_included = 0;
    var async_Promise;
    var async_resolve;
    var certCheckMessageListeners = false;
    var selectedCertificateCache = null;
    var isApprovementSignature = false;
  };

  // EsignCache.nodeRefsCache;
  // EsignCache.refreshCashe;
  // EsignCache.doCheck;
  // EsignCache.async_code_included = 0;
  // EsignCache.async_Promise;
  // EsignCache.async_resolve;
  // EsignCache.certCheckMessageListeners = false;
  // EsignCache.selectedCertificateCache = null;
  // EsignCache.isApprovementSignature = false;

  window.EsignCache = esignCache;
}

window.cadesplugin_load_timeout = 256000;
window.cadesplugin_skip_extension_install = true;

var sign_certificate_notChecked_listener = function(event) {
  var prefix = 'sign_certificate_notChecked_';
  var prefixLength = prefix.length;
  var _data = event.data.toString();
  if (_data.length > prefixLength) {
    if (_data.substring(0, prefixLength) === prefix) {
      closeCapicomStore();
      alert(window.Alfresco.util.message(_data.substring(prefixLength)));
    }
  }
};

export function sendCheckCertificateMessage(certName) {
  window.postMessage('sign_check_certificate_name_' + certName, '*');
}

export function sendSuccessfulMessage(nodeRef) {
  window.postMessage('sign_completed_' + nodeRef, '*');
}

export function sendFailedSignMessages(nodeRefs) {
  for (var i in nodeRefs) {
    sendFailedSignMessage(nodeRefs[i]);
  }
}

export function sendFailedSignMessage(nodeRef) {
  window.postMessage('sign_failed_' + nodeRef, '*');
}

function include_async_code() {
  if (window.EsignCache.async_code_included) {
    return window.EsignCache.async_Promise;
  }

  var fileref = document.createElement('script');
  fileref.setAttribute('type', 'text/javascript');
  fileref.setAttribute('src', '/share/res/citeck/components/documentlibrary/esign/ppapi_code.nocompress.js?ts=1503039530');
  document.getElementsByTagName('head')[0].appendChild(fileref);
  window.EsignCache.async_Promise = new Promise(function(resolve, reject) {
    window.EsignCache.async_resolve = resolve;
  });
  window.EsignCache.async_code_included = 1;
  return window.EsignCache.async_Promise;
}

function hasAspect(nodeRef, aspectName) {
  var xmlHttp_add = new XMLHttpRequest();
  xmlHttp_add.open(
    'GET',
    window.Alfresco.constants.PROXY_URI + 'acm/hasDocumentAspect?nodeRef=' + nodeRef + '&aspect=' + aspectName,
    false
  );
  xmlHttp_add.send(null);
  if (xmlHttp_add.status != 200) {
    return;
  }
  var aspect = eval('(' + xmlHttp_add.responseText + ')').data;
  if (aspect === true || aspect === 'true') {
    return true;
  }
  return false;
}

export function documentSign(nodeRef) {
  documentSignMetadataRefresh(nodeRef, true, false);
}

function documentSignMetadataRefresh(nodeRef, refresh, isApprovementSignature) {
  var nodeRefs = [];
  nodeRefs.push(nodeRef);
  documentsSignMetadataRefresh(nodeRefs, refresh, isApprovementSignature);
}

function documentsSignMetadataRefresh(nodeRefs, refresh, isApprovementSignature) {
  if (nodeRefs.length == 0) {
    return;
  }
  window.EsignCache.nodeRefsCache = nodeRefs;
  window.EsignCache.refreshCashe = refresh;
  window.EsignCache.isApprovementSignature = isApprovementSignature;
  window.EsignCache.doCheck = false;
  getCertificatesContainer();
  var canPromise = !!window.Promise;
  if (canPromise) {
    window.cadesplugin.then(
      function() {
        common_CheckForPlugIn();
      },
      function(error) {
        pleaseInstallPlugin(error);
      }
    );
  } else {
    return checkForPlugIn_NPAPI();
  }
}

function documentsSignWithCheck() {
  window.EsignCache.doCheck = true;
  if (!window.EsignCache.certCheckMessageListeners) {
    window.addEventListener('message', sign_certificate_notChecked_listener, false);
    window.EsignCache.certCheckMessageListeners = true;
  }
  getCertificatesContainer();
  var canPromise = !!window.Promise;
  if (canPromise) {
    window.cadesplugin.then(
      function() {
        common_CheckForPlugIn();
      },
      function(error) {
        pleaseInstallPlugin(error);
      }
    );
  } else {
    return checkForPlugIn_NPAPI();
  }
}

export function getCertificatesContainer() {
  var popup = document.getElementById('availableCertificatesPopup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'availableCertificatesPopup';
    popup.style.visibility = 'hidden';
    popup.style.position = 'fixed';
    popup.style.left = '0px';
    popup.style.top = '0px';
    popup.style.width = '100%';
    popup.style.height = '100%';
    popup.style.backgroundColor = 'rgba(0,0,0,0.7)';
    popup.innerHTML =
      "<div id='availableCertificatesPopup_item' style='position:relative; width:400px; margin:100px auto; background-color:#fff; border:2px solid #000; padding:10px; text-align:center; opacity: 1; z-index: 1500'>" +
      "<button id='availableCertificatesPopup_close' style='float: right; font-size: 10px; background: transparent; border: 1px; margin: -5px'>X</button>" +
      "<p style='text-align: left;'><b>" +
      window.Alfresco.util.message('message.signing.certificates') +
      ':</b></p>' +
      "<div style='padding-top: 4px;'><select size='4' name='availableCertListBox' id='availableCertListBox' style='width:100%;resize:none;border:0;'></select></div>" +
      "<div id='selectedCertInfoContainer' style='padding-top: 4px;text-align: left'></div>" +
      "<div style='padding-top: 8px;'><button id='availableCertificatesPopup_process' style='font:12px Arial;'>" +
      window.Alfresco.util.message('actions.document.sign') +
      '</button></div>' +
      '</div>';
    document.getElementsByTagName('Body')[0].appendChild(popup);
    var certInfoContainer = document.getElementById('selectedCertInfoContainer');
    certInfoContainer.innerHTML =
      '<p><b>' +
      window.Alfresco.util.message('message.signing.certificate') +
      ':</b></p>' +
      "<p id='cert_info_subject'></p>" +
      "<p id='cert_info_issuer'></p>" +
      "<p id='cert_info_from'></p>" +
      "<p id='cert_info_till'></p>" +
      "<p id='cert_info_provname'></p>" +
      "<p id='cert_info_algorithm'></p>";
    var selectBox = document.getElementById('availableCertListBox');
    selectBox.addEventListener('change', function(event) {
      Common_FillCertInfo();
    });

    var btn_sign = document.getElementById('availableCertificatesPopup_process');
    btn_sign.addEventListener('click', function(event) {
      var e = document.getElementById('availableCertListBox');
      var selectedCertID = e.selectedIndex;
      if (selectedCertID == -1) {
        alert(window.Alfresco.util.message('message.signing.select.certificate'));
        return;
      }
      document.getElementById('availableCertificatesPopup').style.visibility = 'hidden';

      Common_SignCadesBES(
        window.EsignCache.nodeRefsCache,
        window.EsignCache.refreshCashe,
        window.EsignCache.doCheck,
        window.EsignCache.isApprovementSignature
      );
    });
    var listener = function() {
      document.getElementById('availableCertificatesPopup').style.visibility = 'hidden';
      sendFailedSignMessages(window.EsignCache.nodeRefsCache);
    };
    document.getElementById('availableCertificatesPopup_close').addEventListener('click', listener);
    popup.addEventListener('click', listener);

    document.getElementById('availableCertificatesPopup_item').addEventListener('click', function(e) {
      e.stopPropagation();
    });
    Common_FillCertList();
  }
  return popup;
}

function showCertificates() {
  getCertificatesContainer().style.visibility = 'visible';
}

function Common_FillCertList() {
  var canAsync = !!window.cadesplugin.CreateObjectAsync;
  if (canAsync) {
    include_async_code().then(function() {
      return window.FillCertList_Async('availableCertListBox');
    });
  } else {
    return FillCertList_NPAPI('availableCertListBox');
  }
}

export function FillCertList_NPAPI(lstId) {
  if (capicomStore == null) {
    try {
      var oStore = window.cadesplugin.CreateObject('CAdESCOM.Store');
      oStore.Open();
    } catch (err) {
      throw window.Alfresco.util.message('message.signing.store.create.failed') + ' ' + GetErrorMessage(err);
    }
    capicomStore = oStore;
  }

  try {
    var lst = document.getElementById(lstId);
    if (!lst) return;
  } catch (ex) {
    return;
  }

  var certCnt;

  try {
    certCnt = capicomStore.Certificates.Count;
    if (certCnt == 0) {
      throw 'Cannot find object or property. (0x80092004)';
    }
  } catch (ex) {
    var message = GetErrorMessage(ex);
    var errorMessages = [
      'Cannot find object or property. (0x80092004)',
      'oStore.Certificates is undefined',
      'Объект или свойство не найдено. (0x80092004)'
    ];
    if (errorMessages.indexOf(message) >= 0) {
      var errormes = (document.getElementById('boxdiv').style.display = '');
      return;
    }
  }

  var Adjust = new CertificateAdjuster();
  for (var i = 1; i <= certCnt; i++) {
    var cert;
    try {
      cert = capicomStore.Certificates.Item(i);
    } catch (ex) {
      alert('Ошибка при перечислении сертификатов: ' + GetErrorMessage(ex));
      return;
    }

    var oOpt = document.createElement('OPTION');
    var dateObj = new Date();
    try {
      if (dateObj < cert.ValidToDate && cert.HasPrivateKey() && cert.IsValid().Result) {
        oOpt.text = Adjust.GetCertInfoString(cert.SubjectName, cert.ValidFromDate);
      } else {
        continue;
      }
    } catch (ex) {
      alert('Ошибка при получении свойства SubjectName: ' + GetErrorMessage(ex));
    }
    try {
      oOpt.value = cert.Thumbprint;
    } catch (ex) {
      alert('Ошибка при получении свойства Thumbprint: ' + GetErrorMessage(ex));
    }

    lst.options.add(oOpt);
  }
}

function Common_FillCertInfo() {
  var canAsync = !!window.cadesplugin.CreateObjectAsync;
  if (canAsync) {
    include_async_code().then(function() {
      return window.FillCertInfo_Async();
    });
  } else {
    return FillCertInfo_NPAPI();
  }
}

function FillCertInfo_NPAPI() {
  var cert = getCertFromCertListBox();
  var BoxID = 'selectedCertInfoContainer';
  var field_prefix = 'cert_info_';

  var Adjust = new CertificateAdjuster();
  document.getElementById(BoxID).style.display = '';
  document.getElementById(field_prefix + 'subject').innerHTML = 'Subject: <b>' + Adjust.GetCertName(cert.SubjectName) + '<b>';
  document.getElementById(field_prefix + 'issuer').innerHTML = 'Issuer: <b>' + Adjust.GetIssuer(cert.IssuerName) + '<b>';
  document.getElementById(field_prefix + 'from').innerHTML = 'From: <b>' + Adjust.GetCertDate(cert.ValidFromDate) + '<b>';
  document.getElementById(field_prefix + 'till').innerHTML = 'To: <b>' + Adjust.GetCertDate(cert.ValidToDate) + '<b>';
  document.getElementById(field_prefix + 'provname').innerHTML = 'Provider: <b>' + cert.PrivateKey.ProviderName + '<b>';
  document.getElementById(field_prefix + 'algorithm').innerHTML = 'Algorithm: <b>' + cert.PublicKey().Algorithm.FriendlyName + '<b>';
}

function Common_SignCadesBES(nodeRefs, refresh, doCheck, approvementSignature) {
  var canAsync = !!window.cadesplugin.CreateObjectAsync;
  if (canAsync) {
    include_async_code().then(function() {
      return window.SignCadesBES_PPAPI(nodeRefs, refresh, doCheck, approvementSignature);
    });
  } else {
    return SignCadesBES_NPAPI(nodeRefs, refresh, doCheck, approvementSignature);
  }
}

function SignCadesBES_NPAPI(nodeRefs, refresh, doCheck, approvementSignature) {
  try {
    try {
      var selectedCertificate = getCertFromCertListBox();
      if (!selectedCertificate) {
        throw window.Alfresco.util.message('message.signing.certificate.not-found');
      }
    } catch (error) {
      sendFailedSignMessages(nodeRefs);
      alert(GetErrorMessage(error));
      return;
    }

    if (doCheck) {
      var adjuster = new CertificateAdjuster();
      var subjectName = selectedCertificate.SubjectName;
      var certName = adjuster.GetCertNameTruncate(subjectName);
      var owner = '';
      var firstName = adjuster.GetFirstNameTruncate(subjectName);
      var lastName = adjuster.GetLastNameTruncate(subjectName);
      if (firstName) {
        owner = firstName;
      }
      if (lastName) {
        if (owner == '') {
          owner = lastName;
        } else {
          owner += ' ' + lastName;
        }
      }
      var issuer = adjuster.GetIssuerTruncate(selectedCertificate.IssuerName);
      var serialNumber = selectedCertificate.SerialNumber;
      var jsonCertInfo = {
        subject: certName,
        subjectFIO: owner,
        issuer: issuer,
        serialNumber: serialNumber
      };
      sendCheckCertificateMessage(encodeURIComponent(window.YAHOO.lang.JSON.stringify(jsonCertInfo)));
    } else {
      try {
        signDocuments(nodeRefs, refresh, selectedCertificate, approvementSignature);
      } catch (error) {
        sendFailedSignMessages(nodeRefs);
        alert(GetErrorMessage(error));
        return;
      }
    }
  } finally {
    if (!doCheck) {
      closeCapicomStore();
    }
  }
}

function getCertFromCertListBox() {
  var e = document.getElementById('availableCertListBox');
  var selectedCertID = e.selectedIndex;
  if (selectedCertID == -1) {
    alert(window.Alfresco.util.message('message.signing.select.certificate'));
    return;
  }
  var thumbprint = e.options[selectedCertID].value
    .split(' ')
    .reverse()
    .join('')
    .replace(/\s/g, '')
    .toUpperCase();
  if (capicomStore == null) {
    try {
      var oStore = window.cadesplugin.CreateObject('CAdESCOM.Store');
      oStore.Open();
    } catch (err) {
      throw window.Alfresco.util.message('message.signing.store.create.failed') + ' ' + GetErrorMessage(err);
    }
    capicomStore = oStore;
  }

  var CAPICOM_CERTIFICATE_FIND_SHA1_HASH = 0;
  var oCerts = capicomStore.Certificates.Find(CAPICOM_CERTIFICATE_FIND_SHA1_HASH, thumbprint);

  if (oCerts.Count == 0) {
    throw window.Alfresco.util.message('message.signing.certificate.not-found');
  }
  window.EsignCache.selectedCertificateCache = oCerts.Item(1);
  return window.EsignCache.selectedCertificateCache;
}

function common_CheckForPlugIn() {
  var canAsync = !!window.cadesplugin.CreateObjectAsync;
  if (canAsync) {
    include_async_code().then(
      function() {
        return window.showCertificates_Async();
      },
      function(error) {
        alert(GetErrorMessage(error));
      }
    );
  } else {
    return showCertificates();
  }
}

function checkForPlugIn_NPAPI() {
  window.addEventListener(
    'message',
    function(event) {
      if (event.data == 'cadesplugin_loaded') {
        showCertificates();
      } else if (event.data == 'cadesplugin_load_error') {
        pleaseInstallPlugin();
      }
    },
    false
  );
  window.postMessage('cadesplugin_echo_request', '*');
}

function signDocuments(nodeRefs, refresh, selectedCertificate, approvementSignature) {
  if (nodeRefs.length > 1) {
    {
      //set cache for pin
      selectedCertificate.PrivateKey.CachePin = true;
    }
    for (var i in nodeRefs) {
      var result = signCadesBES(nodeRefs[i], refresh, selectedCertificate, approvementSignature);
      if (result === undefined) {
        sendFailedSignMessage(nodeRefs[i]);
      }
    }
    {
      //clear cache for pin
      selectedCertificate.PrivateKey.CachePin = false;
      delete selectedCertificate.PrivateKey;
    }
  } else {
    var result2 = signCadesBES(nodeRefs[0], refresh, selectedCertificate, approvementSignature);
    if (result2 === undefined) {
      sendFailedSignMessage(nodeRefs[0]);
    }
  }
}

function signCadesBES(nodeRef, refresh, oCertificate, approvementSignature) {
  var initialNode = nodeRef;
  var jsNodeVersionable = hasAspect(initialNode, 'cm:versionable');
  if (jsNodeVersionable === undefined) {
    alert(window.Alfresco.util.message('message.signing.aspect.get.failed'));
    return;
  }
  if (jsNodeVersionable) {
    var xmlHttp_add = new XMLHttpRequest();
    xmlHttp_add.open('GET', window.Alfresco.constants.PROXY_URI + 'acm/name_lastversion_by_noderef?nodeRef=' + nodeRef, false);
    xmlHttp_add.send(null);
    if (xmlHttp_add.status != 200) {
      return;
    }
    nodeRef = eval('(' + xmlHttp_add.responseText + ')').nodeRef;
  }

  var dataForSign = getDataForSign(nodeRef);
  if (jsNodeVersionable) {
    var currentDocDataForSign = getDataForSign(initialNode);
    if (dataForSign[0].base64 !== currentDocDataForSign[0].base64) {
      alert(window.Alfresco.util.message('message.signing.invalid-hash-sum'));
      return;
    }
  }

  var signedMessage = signCreate(oCertificate, dataForSign[0].base64);
  if (signedMessage == undefined) {
    return;
  }
  var verifyResult = Verify(signedMessage, dataForSign[0].base64);
  if (verifyResult) {
    signPut(nodeRef, signedMessage, refresh, approvementSignature, function() {
      sendSuccessfulMessage(initialNode);
    });
    return nodeRef;
  }
}

function pleaseInstallPlugin(error) {
  if (error === undefined) {
    alert(window.Alfresco.util.message('message.signing.plugin-not-installed'));
  } else {
    alert(error);
  }
  window.open('http://www.cryptopro.ru/products/cades/plugin', 'CryptoProBrowserPlug-in');
}

var CADESCOM_CADES_X_LONG_TYPE_1 = 0x5d;
var CAPICOM_CURRENT_USER_STORE = 2;
var CAPICOM_MY_STORE = 'My';
var CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED = 2;
var CAPICOM_CERTIFICATE_FIND_SUBJECT_NAME = 1;
var CADESCOM_BASE64_TO_BINARY = 1;
var CADES_BES = 1;
var capicomStore = null;

function closeCapicomStore() {
  if (capicomStore != null) {
    capicomStore.Close();
    window.EsignCache.selectedCertificateCache = null;
    capicomStore = null;
  }
}

function signCreate(oCertificate, dataToSign) {
  var oSigner = window.cadesplugin.CreateObject('CAdESCOM.CPSigner');
  oSigner.Certificate = oCertificate;
  //todo
  oSigner.TSAAddress = 'http://cryptopro.ru/tsp/';
  oSigner.Options = 1; //CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN

  var oSignedData = window.cadesplugin.CreateObject('CAdESCOM.CadesSignedData');
  oSignedData.ContentEncoding = CADESCOM_BASE64_TO_BINARY;
  oSignedData.Content = dataToSign;

  try {
    //        var sSignedMessage = oSignedData.SignCades(oSigner, CADESCOM_CADES_X_LONG_TYPE_1, true);
    var sSignedMessage = oSignedData.SignCades(oSigner, CADES_BES, true);
  } catch (err) {
    alert(window.Alfresco.util.message('message.signing.create.failed') + ' ' + GetErrorMessage(err));
    return;
  }

  return sSignedMessage;
}

function signPut(nodeRef, signedMessage, refresh, approvementSignature, onSuccess) {
  try {
    var me = this;
    window.Alfresco.util.Ajax.jsonPost({
      url: window.Alfresco.constants.PROXY_URI + 'acm/digitalSignaturePut',
      dataObj: {
        nodeRef: nodeRef,
        sign: signedMessage,
        signer: window.Alfresco.constants.USERNAME,
        isApprovementSignature: approvementSignature
      },
      successCallback: {
        fn: function(response) {
          if (response.serverResponse.status != 200) {
            window.Alfresco.util.PopupManager.displayPrompt({
              title: response.serverResponse.status,
              text: response.serverResponse.statusText
            });
          } else {
            if (onSuccess) {
              onSuccess();
            }
            if (refresh) {
              window.YAHOO.Bubbling.fire('metadataRefresh');
            }
          }
        },
        scope: me
      },
      failureCallback: {
        fn: function(response) {
          if (response.serverResponse.status != 200) {
            window.Alfresco.util.PopupManager.displayPrompt({
              title: response.serverResponse.status,
              text: response.serverResponse.statusText
            });
          }
        },
        scope: me
      }
    });
  } catch (e) {
    alert(e);
  }
}

function Verify(sSignedMessage, dataToSign) {
  var oSignedData = window.cadesplugin.CreateObject('CAdESCOM.CadesSignedData');
  oSignedData.ContentEncoding = CADESCOM_BASE64_TO_BINARY;
  oSignedData.Content = dataToSign;
  try {
    //        oSignedData.VerifyCades(sSignedMessage, CADESCOM_CADES_X_LONG_TYPE_1);
    //        oSignedData.VerifyCades(sSignedMessage, CADESCOM_CADES_X_LONG_TYPE_1,true);
    oSignedData.VerifyCades(sSignedMessage, CADES_BES, true);
  } catch (err) {
    alert(window.Alfresco.util.message('message.signing.verify.failed') + ' ' + GetErrorMessage(err));
    return false;
  }
  return true;
}

function getDataForSign(nodeRef) {
  var xmlHttp_add = new XMLHttpRequest();
  xmlHttp_add.open('GET', window.Alfresco.constants.PROXY_URI + 'acm/digestAndAttr?nodeRef=' + nodeRef, false);
  xmlHttp_add.send(null);
  if (xmlHttp_add.status != 200) {
    return null;
  }
  return eval('(' + xmlHttp_add.responseText + ')').data;
}

export function GetErrorMessage(e) {
  var err = e.message;
  if (!err) {
    err = e;
  } else if (e.number) {
    if (e.number == '0x8007065B') {
      err = window.Alfresco.util.message('message.signing.license.expired') + ' (' + e.number + ')';
    } else if (e.number == '0x800B010E') {
      err = window.Alfresco.util.message('message.signing.connection.failed') + ' (' + e.number + ')';
    } else if (e.number == '0x80070057') {
      err = window.Alfresco.util.message('message.signing.incorrect.parameter') + ' (' + e.number + ')';
    } else if (e.number == '0x8007000D') {
      err = window.Alfresco.util.message('message.signing.invalid.data') + ' (' + e.number + ')';
    } else {
      err += ' (' + e.number + ')';
    }
  } else if (err.indexOf('(0x8007065B)') > -1) {
    err = window.Alfresco.util.message('message.signing.license.expired') + ' (0x8007065B)';
  } else if (err.indexOf('(0x800B010E)') > -1) {
    err = window.Alfresco.util.message('message.signing.connection.failed') + ' (0x800B010E)';
  } else if (err.indexOf('(0x80070057)') > -1) {
    err = window.Alfresco.util.message('message.signing.incorrect.parameter') + ' (0x80070057)';
  } else if (err.indexOf('(0x8007000D)') > -1) {
    err = window.Alfresco.util.message('message.signing.invalid.data') + ' (0x8007000D)';
  }
  return err;
}

export function CertificateAdjuster() {}

CertificateAdjuster.prototype.truncate = function(from, what) {
  return this.extract(from, what).substr(what.length);
};

CertificateAdjuster.prototype.extract = function(from, what) {
  var value = '';
  var begin = from.indexOf(what);
  if (begin >= 0) {
    var end = from.indexOf(', ', begin);
    value = end < 0 ? from.substr(begin) : from.substr(begin, end - begin);
  }
  return value;
};

CertificateAdjuster.prototype.Print2Digit = function(digit) {
  return digit < 10 ? '0' + digit : digit;
};

CertificateAdjuster.prototype.GetCertDate = function(paramDate) {
  var certDate = new Date(paramDate);
  return (
    this.Print2Digit(certDate.getUTCDate()) +
    '.' +
    this.Print2Digit(certDate.getMonth() + 1) +
    '.' +
    certDate.getFullYear() +
    ' ' +
    this.Print2Digit(certDate.getUTCHours()) +
    ':' +
    this.Print2Digit(certDate.getUTCMinutes()) +
    ':' +
    this.Print2Digit(certDate.getUTCSeconds())
  );
};

CertificateAdjuster.prototype.GetCertNameTruncate = function(certSubjectName) {
  return this.truncate(certSubjectName, 'CN=');
};
CertificateAdjuster.prototype.GetCertName = function(certSubjectName) {
  return this.extract(certSubjectName, 'CN=');
};

CertificateAdjuster.prototype.GetLastNameTruncate = function(certSubjectName) {
  return this.truncate(certSubjectName, 'SN=');
};
CertificateAdjuster.prototype.GetFirstNameTruncate = function(certSubjectName) {
  return this.truncate(certSubjectName, 'G=');
};

CertificateAdjuster.prototype.GetIssuerTruncate = function(certIssuerName) {
  return this.truncate(certIssuerName, 'CN=');
};
CertificateAdjuster.prototype.GetIssuer = function(certIssuerName) {
  return this.extract(certIssuerName, 'CN=');
};

CertificateAdjuster.prototype.GetCertInfoString = function(certSubjectName, certFromDate) {
  return this.extract(certSubjectName, 'CN=') + '; From: ' + this.GetCertDate(certFromDate);
};
