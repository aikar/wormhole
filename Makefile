
NODE_WAF ?= node-waf
NODE_SRC_DIR ?= $(HOME)/src/node
CFLAGS ?= -g -Wall
CXXFLAGS ?= -g -Wall

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
	@echo "Building Wormhole C++ Bindings"
	@cd src ; $(NODE_WAF) configure build
	@cp build/default/whBindings.node lib

# Build the msgpack lib
msgpack:
	@echo "Building msgpack"
	@cd support/msgpack && \
		mkdir -p dist && \
		./configure --enable-static --disable-shared --prefix=$(PWD)/support/msgpack/dist 1>/dev/null && \
		make 1>/dev/null && \
		make install 1>/dev/null
	
cleanbuild:
	@echo "Cleaning up build files"
	@rm -rf build src/.lock-wscript support/msgpack/dist 1>/dev/null
	@cd support/msgpack >/dev/null && \
		make maintainer-clean 1>/dev/null
	
clean: cleanbuild
	@rm -f lib/whBindings.node
	
