//  Copyright (c) 2011 Daniel Ennis <aikar@aikar.co>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

#include <v8.h>
#include <node.h>
#include <node_buffer.h>
#include <node-msgpack.h>

using namespace v8;
using namespace node;

static v8::Persistent<v8::FunctionTemplate> constructor_template;
class Wormhole : public ObjectWrap {
    public:
    // Actual Constructor when object is built in Wormhole::New
    Wormhole(Handle<Object> wrapper) : ObjectWrap() {
        Wrap(wrapper);
        msgpack_unpacker_init(&unpacker, MSGPACK_UNPACKER_INIT_BUFFER_SIZE);
        msgpack_unpacked_init(&result);
    }
    ~Wormhole() {
        msgpack_unpacker_destroy(&unpacker);
        msgpack_unpacked_destroy(&result);
    }
    // get a new Wormhole() and wrap it inside of this
    static Handle<Value> New(const Arguments &args) {
        HandleScope scope;
        Wormhole* wormhole;
        wormhole = new Wormhole(args.This());
        return args.This();
    }
    
    //Wormhole.prototype.unpack();
    static Handle<Value> Feed(const Arguments &args) {
        HandleScope scope;
        Wormhole* wormhole = ObjectWrap::Unwrap<Wormhole>(args.This());
        
        msgpack_unpacker* unpacker = &wormhole->unpacker;
        if (args.Length() <= 0 || !Buffer::HasInstance(args[0])) {
            return ThrowException(Exception::TypeError(
                String::New("First argument must be a Buffer")));
        }
        Local<Object> buf = args[0]->ToObject();
        char* data = Buffer::Data(buf);
        size_t len = Buffer::Length(buf);
        
        if(!msgpack_unpacker_reserve_buffer(unpacker, len)) {
            return ThrowException(Exception::Error(
                String::New("Could not reserve buffer")));
        }
        if (msgpack_unpacker_buffer_capacity(unpacker) < len) {
            return ThrowException(Exception::Error(
                String::New("buffer capacity is less than required length")));
        }
        memcpy(msgpack_unpacker_buffer(unpacker), data, len);
        msgpack_unpacker_buffer_consumed(unpacker, len);
        return scope.Close(True());
    }
    static Handle<Value> GetResult(const Arguments &args) {
        HandleScope scope;
        Wormhole* wormhole = ObjectWrap::Unwrap<Wormhole>(args.This());
        
        msgpack_unpacker* unpacker = &wormhole->unpacker;
        msgpack_unpacked* result   = &wormhole->result;
        
        if (msgpack_unpacker_next(unpacker, result)) {
            return scope.Close(msgpack_to_v8(&result->data));
        }
        return scope.Close(Undefined());
    }
    msgpack_unpacked result;
    msgpack_unpacker unpacker;
};


extern "C" void
init(Handle<Object> target) {
    HandleScope scope;
    
    Local<FunctionTemplate> t = FunctionTemplate::New(Wormhole::New);
    constructor_template = Persistent<FunctionTemplate>::New(t);
    constructor_template->InstanceTemplate()->SetInternalFieldCount(1);
    constructor_template->SetClassName(String::NewSymbol("Wormhole"));
    NODE_SET_PROTOTYPE_METHOD(constructor_template, "feed", Wormhole::Feed);
    NODE_SET_PROTOTYPE_METHOD(constructor_template, "getResult", Wormhole::GetResult);
    target->Set( String::NewSymbol("wormhole"), constructor_template->GetFunction() );
    NODE_SET_METHOD(target, "pack", pack);
};


