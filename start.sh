#!/usr/bin/env bash
sleep 30
if [ -n "${PROXY_TARGET}" ]; then
    sed -i "s,ALFRESCO_TARGET,${PROXY_TARGET},g" /etc/nginx/conf.d/default.conf
fi

if [ "${GATEWAY_TARGET}" != "<GATEWAY_TARGET" ]; then
    sed -i "s/GATEWAY_TARGET/${GATEWAY_TARGET}/" /etc/nginx/conf.d/default.conf
    echo "Enabled gateway-app upstream: "${GATEWAY_TARGET}
else
    sed -i '/#BEGIN_GATEWAY/,/#END_GATEWAY/d' /etc/nginx/conf.d/default.conf
    echo "delete gateway-app upstream"
fi

if [ "${CADVISOR_TARGET}" != "<CADVISOR_TARGET" ]; then
    sed -i "s/CADVISOR_TARGET/${CADVISOR_TARGET}/" /etc/nginx/conf.d/default.conf
    echo "Enabled cadvisor upstream: "${CADVISOR_TARGET}
else
    sed -i '/#BEGIN_CADVISOR/,/#END_CADVISOR/d' /etc/nginx/conf.d/default.conf
    echo "delete cadvisor location"
fi

nginx -g "daemon off;";
