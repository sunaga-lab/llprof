#!/bin/bash


MODILE=`pwd`/llprofpm.so

php -e -d extension=$MODILE test.php

