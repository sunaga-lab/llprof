#ifndef LLPROF_H
#define LLPROF_H

#include <string>
#include "llprof_const.h"
#include "call_tree.h"
#include "class_table.h"
#include "server.h"
#include "platforms.h"
#include "measurement.h"

// Profilerの初期化
void llprof_init();

// クライアントモードの設定
void llprof_client(bool enabled);


#endif // LLPROF_H
