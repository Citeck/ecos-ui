#!/bin/bash

if [ ! -z "${PROXY_TARGET}" ]; then
    sed -i "s,community,${PROXY_TARGET},g" /etc/nginx/conf.d/default.conf
fi
nginx -g "daemon off;";
