#!/usr/bin/env bash

if [ -n "${PROXY_TARGET}" ]; then
    sed -i "s,ALFRESCO_TARGET,${PROXY_TARGET},g" /etc/nginx/conf.d/default.conf
fi
if [ -z "${GATEWAY_TARGET}" ]; then
    sed -i '/#BEGIN_GATEWAY/,/#END_GATEWAY/d' /etc/nginx/conf.d/default.conf
else
    sed -i "s/GATEWAY_TARGET/${GATEWAY_TARGET}/" /etc/nginx/conf.d/default.conf
fi
nginx -g "daemon off;";

