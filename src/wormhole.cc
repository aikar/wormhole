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

/**
 * Scans a buffer looking for the header start symbol and then array or null
 * array(headstart, length)
 * or array(headstart, null) if found head but not enough data for length (rare)
 *
 * Null = bad data (header was long enough but contained no start symbols)
 */
static Handle<Value> wh_getlength(const Arguments &args) {
    HandleScope scope;

    Local<Object> buf = args[0]->ToObject();
    uint32_t len = 0;

    Local<Array> result = Array::New(2);

    size_t buflen = Buffer::Length(buf);
    
    // the js side should enforce the 2 min
    if (buflen >= 2) {
        char* data = Buffer::Data(buf);
        for (size_t i = 0; i < buflen - 1; i++) {
            if ((unsigned char) data[i]   == 0xFF &&
                (unsigned char) data[i+1] == 0x0F) {
                result->Set(Number::New(0), Uint32::New(i));
                if (i+6 <= buflen) {
                    len = le32toh(*(uint32_t*)(data + i + 2));
                    result->Set(Number::New(1), Uint32::New(len));
                } else {
                    result->Set(Number::New(1), Null());
                }
                return scope.Close(result);
            }
        }
    }
    return scope.Close(Null());
}
/**
 * Builds header with 0xFF0x0F32bitlen
 */
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
/**
 * Exports the functions
 */
extern "C" void init(Handle<Object> target) {
    HandleScope scope;

    NODE_SET_METHOD(target, "getlength", wh_getlength);
    NODE_SET_METHOD(target, "buildheader", wh_buildheader);
}
