
#include "http.h"
#include "data_store.h"
#include "../llprofcommon/network.h"
#include <string>

#include <iostream>

using namespace std;
using namespace llprof;


void print_usage()
{
    cout <<
        "Usage: webmon [--help]\n"
        "\n"
        "Environment Variable:\n"
        "    WEBMON_INTERVAL\n"
        "    WEBMON_SINGLE\n"
        "    WEBMON_ATTR\n"
    ;
    
    
}

int main()
{
    InitSocketSubSystem();
    InitDataStore();
    start_http_server();
    cout << "Webserver start." << endl;
    
    while(true)
        sleep(100);
}

