
#include "llprof.h"

#include <iostream>

#include <stdlib.h>
#include <string.h>

extern "C" {
#include "lua.h"     /* lua_*  */
#include "lauxlib.h" /* luaL_* */
}

using namespace std;

extern "C" int luaopen_llprofpm(lua_State *L);

static luaL_Reg reg[] = {
#  {"test", l_test},
  {NULL, NULL}
};

void lua_llprof_hook(lua_State *L, lua_Debug *ar)
{
    lua_getinfo(L, "nS", ar);
    if(ar->event == LUA_HOOKCALL)
    {
        char *p = (char *)ar->name;
        cout << "Call name:" << ar->name << " source:" << (void *)ar->name << endl;
        llprof_call_handler((nameid_t)p, p);
    }
    else if(ar->event == LUA_HOOKRET || ar->event == LUA_HOOKTAILRET)
    {
        llprof_return_handler();
        cout << "Return:" << endl;
    }
}

const char *lua_name_func(nameid_t nameid, void *p)
{
    if(!nameid)
        return "(null)";
    if(p)
        return (char *)p;
    return "(invalid)";
}

int luaopen_llprofpm(lua_State *L)
{
    llprof_set_time_func(get_time_now_nsec);
    llprof_set_name_func(lua_name_func);
    llprof_init();

    luaL_register(L, "llprofpm", reg);
    lua_sethook(L, lua_llprof_hook, LUA_MASKCALL | LUA_MASKRET, 0);
    return 1;
}
