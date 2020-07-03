
run:
	node ./src/index.js > ./output/latest
	cat ./output/latest

.PHONY: clean

clean:
	rm -rf output/*
