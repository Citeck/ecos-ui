#!/usr/bin/env bash

ECOS=${1:-enterprise}
VERSION=${2:-3.8.0-snapshot}

echo "start with ecos image $ECOS:$VERSION"

yarn
yarn build
# Меняем образ в первом сервисе, попавшем под шаблон
sed -i '0,/image: nexus.citeck.ru\/ecos-.*/s/image: nexus.citeck.ru\/ecos-.*/image: nexus.citeck.ru\/ecos-'${ECOS}':'${VERSION}'/' docker-compose.yaml
docker-compose pull -f ./docker-compose-dev.yaml
docker-compose up -f ./docker-compose-dev.yaml --build -d
