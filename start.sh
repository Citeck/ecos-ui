#!/usr/bin/env bash

if [ -z "${PROXY_TARGET}" ]; then
    sed -i "s,/community,${PROXY_TARGET},g" /etc/nginx/default.d/ssl
fi
nginx -g "daemon off;";
