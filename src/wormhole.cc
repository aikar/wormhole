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
#include <endian.h>

using namespace v8;
using namespace node;

static Handle<Value> wh_getlength(const Arguments &args) {
    HandleScope scope;

    Local<Object> buf = args[0]->ToObject();
    uint32_t iReturnValue = 0;
    if (Buffer::Length(buf) >= 6) {
        char* data = Buffer::Data(buf);
        if ((unsigned char)data[0] == 0xFF && (unsigned char)data[1] == 0x0F) {
            iReturnValue = le32toh(*(uint32_t*)(data+2));
        } else {
            iReturnValue = -1;
        }
    }
    return scope.Close(Integer::New(iReturnValue));
}

static Handle<Value> wh_buildheader(const Arguments &args) {
    HandleScope scope;

    uint32_t len = args[0]->Uint32Value();

    Buffer* bp = Buffer::New(6);
    char* buf = Buffer::Data(bp->handle_);
    // 0xFF 0x0F <size> header
    *(buf) = 0xFF;
    *(buf+1) = 0x0F;
    *(uint32_t*)(buf+2) = htole32(len);
    return scope.Close(bp->handle_);
}

extern "C" void init(Handle<Object> target) {
    HandleScope scope;

    NODE_SET_METHOD(target, "getlength", wh_getlength);
    NODE_SET_METHOD(target, "buildheader", wh_buildheader);
}
