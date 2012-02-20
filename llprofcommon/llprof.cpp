
#include "llprof.h"
#include <string>
#include <cstdlib>
#include <cstdio>
#include "record_type.h"
using namespace std;

bool g_client_mode = true;

void llprof_init()
{
#ifdef LLPROF_DEBUG
    cout << "[llprof] Debug mode enabled." << endl;
#endif

    if(llprof_get_target_name() == "")
    {
        string target_name;
        if(getenv("LLPROF_PROFILE_TARGET_NAME"))
            target_name = getenv("LLPROF_PROFILE_TARGET_NAME");
        else
            target_name = "noname";
        char pidstr[64];
        
        sprintf(pidstr, " (%d)", (int)getpid());
        target_name += pidstr;
        llprof_set_target_name(target_name.c_str());
    }
    

    llprof_calltree_init();
    llprof_start_server();
    if(g_client_mode)
    {
        llprof_start_client_thread();
    }
}



/* クライアントモードの設定 */

void llprof_client(bool enabled)
{
    g_client_mode = enabled;
}
