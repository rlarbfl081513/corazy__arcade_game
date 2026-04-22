#!/bin/bash

# Git safe directory 설정
git config --global --add safe.directory '*'

# Credential helper 설정
git config --global --unset credential.https://lab.ssafy.com.provider 2>/dev/null || true
git config --global credential.helper store

# 버전 확인
java -version
gradle -v