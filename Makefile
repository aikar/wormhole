CWD = $(shell pwd -P)
NODE_WAF ?= node-waf
NODE_SRC_DIR ?= $(HOME)/src/node
CFLAGS ?= -g -Wall
CXXFLAGS ?= -g -Wall

MODULE_LIB_DIR = $(CWD)/lib
# We need to build position-independent code regardless of platform
CFLAGS += -fPIC
CXXFLAGS += -fPIC

# These variables are respected by waf if we export them
export CFLAGS CXXFLAGS

all: msgpack wormhole

#build libs then clean up - for NPM
makelibs: wormhole cleanbuild

# Build Wormhole
wormhole: msgpack
	cd src && \
		$(NODE_WAF) configure build && \
		cp ../build/default/whBindings.node $(MODULE_LIB_DIR)

# Build the msgpack lib
msgpack:
	cd support/msgpack && \
		mkdir -p dist && \
		(test -f Makefile || ./configure --enable-static --disable-shared \
			--prefix=$(PWD)/support/msgpack/dist ) && \
		make 1>/dev/null && make install 1>/dev/null
	
cleanbuild:
	rm -rf build src/.lock-wscript support/msgpack/dist && \
	cd support/msgpack && \
	(test -f Makefile && make maintainer-clean || true)
	
clean: cleanbuild
	rm -f lib/whBindings.node
	
