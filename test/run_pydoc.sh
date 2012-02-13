#!/bin/bash


export PYTHONPATH=../pyllprof/build/lib.linux-x86_64-2.7/
export LLPROF_STARTUP=1
export LLPROF_CM_HOST=localhost
export LLPROF_PROFILE_TARGET_NAME="pydoc"
rm -rf pydocs

python ./run_pydoc.py

