#!/bin/bash


pecl-gen llprof_php.xml

cd llprofpm
phpize
aclocal
autoreconf --force
./configure --enable-llprofpm
make



