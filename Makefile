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

# Build binary packing helpers.
wormhole:
	cd src && \
		$(NODE_WAF) configure && \
		$(NODE_WAF) build && \
		cd .. && \
		cp build/default/whBindings.node $(MODULE_LIB_DIR) && \
		rm -rf build

# Build the msgpack bindings
msgpack:
	cd support/msgpack && make && \
	cp build/default/mpBindings.node $(MODULE_LIB_DIR)

clean:
	rm -rf build lib/mpBindings.node lib/whBindings.node && \
	rm -f src/.lock-wscript && \
	cd support/msgpack && (make clean || true)
