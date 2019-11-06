import {
  sendCheckCertificateMessage,
  GetErrorMessage,
  CertificateAdjuster,
  sendFailedSignMessages,
  sendFailedSignMessage,
  sendSuccessfulMessage,
  getCertificatesContainer
} from './npapi_code';

let capicomStore_Async = null,
  selectedCertificate_Async = null;

function httpGet(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.onload = function() {
      if (this.status == 200) {
        resolve(this.response);
      } else {
        var error = new Error(this.statusText);
        error.code = this.status;
        reject(error);
      }
    };

    xhr.onerror = function() {
      reject(new Error('Network Error'));
    };

    xhr.send();
  });
}

function httpPost(url, dataObj, refresh) {
  return new Promise(function(resolve, reject) {
    var me = this;
    window.Alfresco.util.Ajax.jsonPost({
      url: url,
      dataObj: dataObj,
      successCallback: {
        fn: function(response) {
          if (response.serverResponse.status != 200) {
            window.Alfresco.util.PopupManager.displayPrompt({
              title: response.serverResponse.status,
              text: response.serverResponse.statusText
            });
          } else {
            if (refresh) {
              window.YAHOO.Bubbling.fire('metadataRefresh');
            }
          }
          resolve(response);
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
          reject(response);
        },
        scope: me
      }
    });
  });
}

function* hasAspect_Async(nodeRef, aspectName) {
  let result = yield httpGet(window.Alfresco.constants.PROXY_URI + 'acm/hasDocumentAspect?nodeRef=' + nodeRef + '&aspect=' + aspectName);
  return JSON.parse(result).data;
}
function* getLastVersion_Async(nodeRef) {
  let result = yield httpGet(window.Alfresco.constants.PROXY_URI + 'acm/name_lastversion_by_noderef?nodeRef=' + nodeRef);
  return JSON.parse(result).nodeRef;
}
function* getDataForSign_Async(nodeRef) {
  let result = yield httpGet(window.Alfresco.constants.PROXY_URI + 'acm/digestAndAttr?nodeRef=' + nodeRef);
  return JSON.parse(result).data;
}

function signDocuments_Async(nodeRefs, refresh, certificate, approvementSignature) {
  window.cadesplugin.async_spawn(function*(arg) {
    if (nodeRefs.length > 1) {
      var privateKey = yield certificate.PrivateKey;
      yield privateKey.propset_CachePin(true);
    }

    for (var i in nodeRefs) {
      try {
        yield* signCadesBES_Async(nodeRefs[i], certificate, refresh, approvementSignature);
      } catch (e) {
        sendFailedSignMessage(nodeRefs[i]);
        window.Alfresco.util.PopupManager.displayPrompt({
          title: 'Warning',
          text: window.Alfresco.util.message('message.signing.create.failed') + ' ' + GetErrorMessage(e) + '(' + nodeRefs[i] + ')',
          modal: true
        });
        break;
      }
    }

    if (nodeRefs.length > 1) {
      yield privateKey.propset_CachePin(false);
    }
  }); //cadesplugin.async_spawn
}

function* signCadesBES_Async(nodeRef, certificate, refresh, approvementSignature) {
  var initialNode = nodeRef;
  let jsNodeVersionable;
  try {
    jsNodeVersionable = yield* hasAspect_Async(nodeRef, 'cm:versionable');
  } catch (e) {
    throw window.Alfresco.util.message('message.signing.aspect.get.failed') + ' ' + GetErrorMessage(e);
  }
  if (jsNodeVersionable) {
    try {
      nodeRef = yield* getLastVersion_Async(nodeRef);
    } catch (e) {
      throw window.Alfresco.util.message('message.signing.lastversion.get.failed') + ' ' + GetErrorMessage(e);
    }
  }
  let objDataForSign = yield* getDataForSign_Async(nodeRef);
  if (jsNodeVersionable) {
    var currentDocDataForSign = yield* getDataForSign_Async(initialNode);
    if (objDataForSign[0].base64 !== currentDocDataForSign[0].base64) {
      throw window.Alfresco.util.message('message.signing.invalid-hash-sum');
    }
  }

  let dataToSign = objDataForSign[0].base64;
  let Signature;
  try {
    Signature = yield* signCreate_Async(certificate, dataToSign);
  } catch (err) {
    throw window.Alfresco.util.message('message.signing.create.failed') + ' ' + GetErrorMessage(err);
  }

  try {
    var oSignedData = yield window.cadesplugin.CreateObjectAsync('CAdESCOM.CadesSignedData');
    yield oSignedData.propset_ContentEncoding(window.cadesplugin.CADESCOM_BASE64_TO_BINARY); //
    yield oSignedData.propset_Content(dataToSign);

    yield oSignedData.VerifyCades(Signature, window.cadesplugin.CADESCOM_CADES_BES, true);

    try {
      yield httpPost(
        window.Alfresco.constants.PROXY_URI + 'acm/digitalSignaturePut',
        {
          nodeRef: nodeRef,
          sign: Signature,
          signer: window.Alfresco.constants.USERNAME,
          isApprovementSignature: approvementSignature
        },
        refresh
      );
      sendSuccessfulMessage(initialNode);
    } catch (e) {
      throw e;
    }
  } catch (err) {
    throw window.Alfresco.util.message('message.signing.verify.failed') + ' ' + GetErrorMessage(err);
  }
}

function* signCreate_Async(certificate, dataToSign) {
  var errormes = '';
  try {
    var oSigner = yield window.cadesplugin.CreateObjectAsync('CAdESCOM.CPSigner');
  } catch (err) {
    errormes = window.Alfresco.util.message('message.signing.signer.create.failed') + ': ' + GetErrorMessage(err);
    throw errormes;
  }
  var oSigningTimeAttr = yield window.cadesplugin.CreateObjectAsync('CADESCOM.CPAttribute');

  yield oSigningTimeAttr.propset_Name(window.cadesplugin.CAPICOM_AUTHENTICATED_ATTRIBUTE_SIGNING_TIME);
  var oTimeNow = new Date();
  yield oSigningTimeAttr.propset_Value(oTimeNow);
  var attr = yield oSigner.AuthenticatedAttributes2;
  yield attr.Add(oSigningTimeAttr);

  if (oSigner) {
    yield oSigner.propset_Certificate(certificate);
    yield oSigner.propset_Options(window.cadesplugin.CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN);
  } else {
    errormes = window.Alfresco.util.message('message.signing.signer.create.failed');
    throw errormes;
  }

  var oSignedData = yield window.cadesplugin.CreateObjectAsync('CAdESCOM.CadesSignedData');
  if (dataToSign) {
    // Данные на подпись ввели
    yield oSignedData.propset_ContentEncoding(window.cadesplugin.CADESCOM_BASE64_TO_BINARY); //
    if (typeof setDisplayData != 'undefined') {
      //Set display data flag flag for devices like Rutoken PinPad
      yield oSignedData.propset_DisplayData(1);
    }
    yield oSignedData.propset_Content(dataToSign);

    try {
      return yield oSignedData.SignCades(oSigner, window.cadesplugin.CADESCOM_CADES_BES, true);
    } catch (err) {
      errormes = window.Alfresco.util.message('message.signing.create.failed') + ' ' + GetErrorMessage(err);
      throw errormes;
    }
  }
}

function* closeCapicomStore_Async() {
  if (capicomStore_Async != null) {
    selectedCertificate_Async = null;
    yield capicomStore_Async.Close();
    capicomStore_Async = null;
  }
}

function SignCadesBES_PPAPI(nodeRefs, refresh, doCheck, approvementSignature) {
  window.cadesplugin.async_spawn(function*(arg) {
    try {
      try {
        var selectedCertificate = yield* getCertFromCertListBox_Async();
        if (!selectedCertificate) {
          alert(window.Alfresco.util.message('message.signing.certificate.not-found'));
          return;
        }
      } catch (error) {
        sendFailedSignMessages(nodeRefs);
        alert(GetErrorMessage(error));
        return;
      }

      if (doCheck) {
        window.cadesplugin.async_spawn(function*(args) {
          var adjuster = new CertificateAdjuster();
          var subjectName = yield args[0].SubjectName;
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
          var issuer = adjuster.GetIssuerTruncate(yield args[0].IssuerName);
          var serialNumber = yield args[0].SerialNumber;
          var jsonCertInfo = {
            subject: certName,
            subjectFIO: owner,
            issuer: issuer,
            serialNumber: serialNumber
          };
          sendCheckCertificateMessage(encodeURIComponent(window.YAHOO.lang.JSON.stringify(jsonCertInfo)));
        }, selectedCertificate); //window.cadesplugin.async_spawn
      } else {
        try {
          signDocuments_Async(nodeRefs, refresh, selectedCertificate, approvementSignature);
        } catch (error) {
          sendFailedSignMessages(nodeRefs);
          alert(GetErrorMessage(error));
          return;
        }
      }
    } finally {
      if (!doCheck) {
        yield* closeCapicomStore_Async();
      }
    }
  });
}

function showCertificates_Async() {
  getCertificatesContainer().style.visibility = 'visible';
}

function* getCertFromCertListBox_Async() {
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
  if (capicomStore_Async == null) {
    try {
      capicomStore_Async = yield window.cadesplugin.CreateObjectAsync('CAdESCOM.Store');
      yield capicomStore_Async.Open();
    } catch (err) {
      throw window.Alfresco.util.message('message.signing.store.create.failed') + ' ' + GetErrorMessage(err);
    }
  }

  var all_certs = yield capicomStore_Async.Certificates;
  var oCerts = yield all_certs.Find(window.cadesplugin.CAPICOM_CERTIFICATE_FIND_SHA1_HASH, thumbprint, true);

  let certificateCount = yield oCerts.Count;
  if (certificateCount == 0) {
    throw window.Alfresco.util.message('message.signing.certificate.not-found');
  }
  selectedCertificate_Async = yield oCerts.Item(1);
  return selectedCertificate_Async;
}

function FillCertList_Async(lstId) {
  window.cadesplugin.async_spawn(function*() {
    if (capicomStore_Async == null) {
      try {
        capicomStore_Async = yield window.cadesplugin.CreateObjectAsync('CAdESCOM.Store');
        yield capicomStore_Async.Open();
      } catch (err) {
        throw window.Alfresco.util.message('message.signing.store.create.failed') + ' ' + GetErrorMessage(err);
      }
    }

    var lst = document.getElementById(lstId);
    if (!lst) {
      return;
    }
    var certCnt;
    var certs;

    try {
      certs = yield capicomStore_Async.Certificates;
      certCnt = yield certs.Count;
    } catch (ex) {
      var errormes = (document.getElementById('boxdiv').style.display = '');
      return;
    }

    if (certCnt == 0) {
      var errormes = (document.getElementById('boxdiv').style.display = '');
      return;
    }

    var Adjust = new CertificateAdjuster();
    for (var i = 1; i <= certCnt; i++) {
      var cert;
      try {
        cert = yield certs.Item(i);
      } catch (ex) {
        alert('Ошибка при перечислении сертификатов: ' + GetErrorMessage(ex));
        return;
      }

      var oOpt = document.createElement('OPTION');
      var dateObj = new Date();
      try {
        var ValidToDate = new Date(yield cert.ValidToDate);
        var ValidFromDate = new Date(yield cert.ValidFromDate);
        var Validator = yield cert.IsValid();
        var IsValid = yield Validator.Result;
        if (dateObj < ValidToDate && (yield cert.HasPrivateKey()) && IsValid) {
          oOpt.text = Adjust.GetCertInfoString(yield cert.SubjectName, ValidFromDate);
        } else {
          continue;
        }
      } catch (ex) {
        alert('Ошибка при получении свойства SubjectName: ' + GetErrorMessage(ex));
      }
      try {
        oOpt.value = yield cert.Thumbprint;
      } catch (ex) {
        alert('Ошибка при получении свойства Thumbprint: ' + GetErrorMessage(ex));
      }

      lst.options.add(oOpt);
    }
  }); //window.cadesplugin.async_spawn
}

function FillCertInfo_Async() {
  window.cadesplugin.async_spawn(function*(arg) {
    var selectedCertificate = yield* getCertFromCertListBox_Async();

    window.cadesplugin.async_spawn(
      function*(args) {
        var Adjust = new CertificateAdjuster();
        document.getElementById(args[1]).style.display = '';
        document.getElementById(args[2] + 'subject').innerHTML = 'Subject: <b>' + Adjust.GetCertName(yield args[0].SubjectName) + '</b>';
        document.getElementById(args[2] + 'issuer').innerHTML = 'Issuer: <b>' + Adjust.GetIssuer(yield args[0].IssuerName) + '</b>';
        document.getElementById(args[2] + 'from').innerHTML = 'From: <b>' + Adjust.GetCertDate(yield args[0].ValidFromDate) + '</b>';
        document.getElementById(args[2] + 'till').innerHTML = 'To: <b>' + Adjust.GetCertDate(yield args[0].ValidToDate) + '</b>';
        var pubKey = yield args[0].PublicKey();
        var algo = yield pubKey.Algorithm;
        var fAlgoName = yield algo.FriendlyName;
        document.getElementById(args[2] + 'algorithm').innerHTML = 'Algorithm: <b>' + fAlgoName + '</b>';
        var oPrivateKey = yield args[0].PrivateKey;
        var sProviderName = yield oPrivateKey.ProviderName;
        document.getElementById(args[2] + 'provname').innerHTML = 'Provider: <b>' + sProviderName + '</b>';
      },
      selectedCertificate,
      'selectedCertInfoContainer',
      'cert_info_'
    ); //window.cadesplugin.async_spawn
  }); //window.cadesplugin.async_spawn
}

window.EsignCache.async_resolve();
