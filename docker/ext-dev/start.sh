#!/bin/bash

if [ ! -z "${PROXY_TARGET}" ]; then
    echo "PROXY_TARGET = '${PROXY_TARGET}'"
    sed -i "s,ALFRESCO_TARGET,${PROXY_TARGET},g" /etc/nginx/conf.d/default.conf
fi

if [ ! -z "${GATEWAY_TARGET}" ]; then
    echo "GATEWAY_TARGET = '${GATEWAY_TARGET}'"
    sed -i "s,GATEWAY_TARGET,${GATEWAY_TARGET},g" /etc/nginx/conf.d/default.conf
else
    echo "GATEWAY_TARGET is not set. Default: gateway-app"
    sed -i "s,GATEWAY_TARGET,gateway-app,g" /etc/nginx/conf.d/default.conf
fi

echo "Start nginx. URL: http://localhost/share";

nginx -g "daemon off;";
