#!/bin/bash

if [ ! -z "${PROXY_TARGET}" ]; then
    echo "PROXY_TARGET = '${PROXY_TARGET}'"
    sed -i "s,ALFRESCO_TARGET,${PROXY_TARGET},g" /etc/nginx/conf.d/default.conf
fi

echo "Start nginx. URL: http://localhost/share";

nginx -g "daemon off;";
