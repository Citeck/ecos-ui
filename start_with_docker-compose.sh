#!/usr/bin/env bash
yarn
yarn build
docker-compose build
docker-compose pull
docker-compose up -d
