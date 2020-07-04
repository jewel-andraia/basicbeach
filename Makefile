
run:
	node ./src/index.js --png=true -g xive-xaugh-xove -m "thingiverse 1784637 text_heart_chain"  > ./output/latest
	cat ./output/latest

.PHONY: clean

clean:
	rm -rf output/*
