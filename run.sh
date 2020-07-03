#!/bin/bash

res=$(node ./src/index.js)
echo $res
echo $res > ./output/test.txt
ls -la "$res"
