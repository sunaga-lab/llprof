#!/bin/bash
set -e

cp -av llprofcommon/* rrprofext/
cd rrprofext

ruby extconf.rb
make
make install



