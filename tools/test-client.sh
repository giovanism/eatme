#!/bin/sh

. ./common.sh

cd ${DIR_ROOT}/client
npm install
npm run build
