

#include <assert.h>
#include <time.h>
#include <errno.h>

#include <string>
#include <iostream>
#include <vector>
#include <sstream>
#include <map>
#include <cstdlib>

#include "platforms.h"
#include "measurement.h"
#include "server.h"
#include <cstring>
#include <cstdlib>
#include <cstdio>

#include "call_tree.h"
#include "class_table.h"

#include "data_struct.h"


using namespace std;

// #define LLPROF_DEBUG

//int gDefaultNodeInfoTableSize = 65536;
//int gDefaultSerializedNodeInfoTableSize = 65536;
int gDefaultNodeInfoTableSize = 1024;
int gDefaultSerializedNodeInfoTableSize = 1024;

struct pvtype_t
{
    string record_type_id;
    string record_type_name;
    pv_counter_function_t counter_func;
    int record_index;
};
vector<pvtype_t> g_records;
vector<int> g_active_records;

static const char * (*g_name_func)(nameid_t, void *);
void llprof_set_name_func(const char * cb(nameid_t, void *))
{
    g_name_func = cb;
}

const char *llprof_call_name_func(nameid_t id, void *p)
{
    return (*g_name_func)(id, p);
}


typedef map<nameid_t, unsigned int> children_t;
struct MethodNodeInfo
{
    unsigned int serialized_node_index;
    unsigned int generation_number;
    
    nameid_t nameid;
	children_t *children;
	unsigned int parent_node_id;
    profile_value_t start_value[]; // 
};

struct MethodNodeSerializedInfo
{
    nameid_t nameid;
    unsigned int call_node_id;
	unsigned int parent_node_id;
 	unsigned long long int call_count;
    profile_value_t profile_value[]; // [NUM_RECORDS];
};


#define ADD_SLIDE(struct_field, field_name_str)     { \
    slides[slide_idx].field_name = field_name_str; \
    slides[slide_idx].slide = (int)((unsigned long long int)&test.struct_field - (unsigned long long int)&test); \
    slide_idx++; \
}

void CallTree_GetSlide(slide_record_t **ret, int *nfield)
{
    static slide_record_t slides[16];
    int slide_idx = 0;
    {
        MethodNodeSerializedInfo test;
        
        ADD_SLIDE(nameid, "pdata.nameid")
        ADD_SLIDE(profile_value, "pdata.value")
        ADD_SLIDE(call_count, "pdata.call_count")
        ADD_SLIDE(call_node_id, "pdata.call_node_id")
        ADD_SLIDE(parent_node_id, "pdata.parent_node_id")
        slides[slide_idx].field_name = "pdata.record_size";
        slides[slide_idx].slide = sizeof(test) + (g_active_records.size() * sizeof(profile_value_t));
        slide_idx++;
    }

    *nfield = slide_idx;
    *ret = slides;
}








int llprof_add_counter_pv(const char *record_id, const char *record_name, pv_counter_function_t func)
{
    int i = g_records.size();
    g_records.resize(i + 1);
    g_records[i].record_type_id = record_id;
    g_records[i].record_type_name = record_name;
    g_records[i].counter_func = func;
    g_records[i].record_index = -1;
    return i;
}

int llprof_add_event_pv(const char *record_id, const char *record_name)
{
    int i = g_records.size();
    g_records.resize(i + 1);
    g_records[i].record_type_id = record_id;
    g_records[i].record_type_name = record_name;
    g_records[i].counter_func = NULL;
    g_records[i].record_index = -1;
    return i;
}

string llprof_get_record_info()
{
    string result;
    char buf[64];
    sprintf(buf, "%d", (int)g_active_records.size());
    result = string(buf) + "\n";
    for(int i = 0; i < g_active_records.size(); i++)
    {
        string name = g_records[g_active_records[i]].record_type_name;
        string flag;
        if(i > 0 &&  g_active_records[i-1] == g_active_records[i])
        {
            flag = "S";
            name += "(sv)";
        }
        else if(g_records[g_active_records[i]].counter_func)
        {
            flag = "A";
        }
        sprintf(buf, "%d", i);
        result += string(buf) + " " + name + " U f" + flag + "\n";
    }
    return result;
}


pvt_index_t llprof_get_pvt_index_from_name(const char *pvt_id)
{
    for(int i = 0; i < g_records.size(); i++)
    {
        if(g_records[i].record_type_id == pvt_id)
        {
            return i;
        }
    }
    return -1;
}

bool llprof_is_pvt_enabled(pvt_index_t pvt)
{
    return g_records[pvt].record_index != -1;
}

int llprof_add_active_record(const char *pvt_id)
{
    int i = llprof_get_pvt_index_from_name(pvt_id);
    if(i == -1)
        return -1;
    
    if(g_records[i].record_index != -1)
    {
        cout << "Record Type ID duplicated: " << pvt_id << endl;
        return -1;
    }
    if(g_records[i].counter_func)
    {
        g_active_records.push_back(i);
        g_active_records.push_back(i);
        return g_active_records.size() - 2;
    }
    else
    {
        g_active_records.push_back(i);
        return g_active_records.size() - 1;
    }
}

void llprof_set_record_string(const char *record_string)
{
    if(!record_string)
        return;
    int n;
    string rstr(record_string);
    string delim = " ";
	for(int i = 0; i <= rstr.length(); i = n+1 )
    {
		n = rstr.find_first_of(delim, i);
		if(n == string::npos)
            n = rstr.length();
		
        llprof_add_active_record(rstr.substr(i, n-i).c_str());
	}
}

inline void llprof_rtype_start_node(profile_value_t *value)
{
    for(int i = 0; i < g_active_records.size(); i++)
    {
        if(g_records[g_active_records[i]].counter_func)
        {
            ++i;
            value[i] = (*g_records[g_active_records[i]].counter_func)();
        }
        ++i;
    }
}

inline void llprof_rtype_end_node(const profile_value_t *start_value, profile_value_t *value)
{
    for(int i = 0; i < g_active_records.size(); i++)
    {
        if(g_records[g_active_records[i]].counter_func)
        {
            value[0] += (*g_records[g_active_records[i]].counter_func)() - start_value[i+1];
            ++i;
        }
        ++i;
    }
}


struct ThreadInfo
{
    unsigned long long int ThreadID;

    free_stride_vector<MethodNodeInfo> NodeInfoArray;


    free_stride_vector<MethodNodeSerializedInfo>* SerializedNodeInfoArray;


    unsigned int CurrentCallNodeID;
    unsigned int GenerationNumber;

    pthread_mutex_t DataMutex;
    pthread_mutex_t GlobalMutex;

    int stop;
    
    ThreadInfo *next;

    profile_value_t *NowInfo;

    ThreadInfo(unsigned long long thread_id)
    {
        ThreadID = thread_id;
        pthread_mutex_init(&GlobalMutex, NULL);
        pthread_mutex_init(&DataMutex, NULL);
        stop = 0;
        
        SerializedNodeInfoArray = new free_stride_vector<MethodNodeSerializedInfo>();
        SerializedNodeInfoArray->set_extra_stride(g_active_records.size() * sizeof(profile_value_t));
        NowInfo = new profile_value_t[g_active_records.size()+1];
#ifdef LLPROF_DEBUG
        cout << "[NewThread]"  << endl << "  pNodes = " << SerializedNodeInfoArray << endl;
#endif
        NodeInfoArray.set_extra_stride(g_active_records.size() * sizeof(profile_value_t));
        NodeInfoArray.reserve(gDefaultNodeInfoTableSize);
        SerializedNodeInfoArray->reserve(gDefaultSerializedNodeInfoTableSize);
        

        NodeInfoArray.resize(1);
        GenerationNumber = 1;
        CurrentCallNodeID = AddCallNode(0, 0, NULL);

        next = NULL;

    }

    unsigned int AddCallNode(unsigned int parent_node_id, nameid_t nameid, void *name_data_ptr);


};




ThreadInfo *gFirstThread;
ThreadInfo *gLastThread;

pthread_key_t gCurrentThreadKey;

pthread_mutex_t gThreadDataMutex;
unsigned long long int gThreadMaxID = 0;

ThreadInfo *get_current_thread()
{
    ThreadInfo *tdata = (ThreadInfo *)pthread_getspecific(gCurrentThreadKey);
    if(tdata)
        return tdata;

    pthread_mutex_lock(&gThreadDataMutex);
    tdata = new ThreadInfo(gThreadMaxID);
    pthread_setspecific(gCurrentThreadKey, tdata);
    
    gThreadMaxID++;
    if(!gLastThread)
    {
        gFirstThread = gLastThread = tdata;
    }
    else
    {
        gLastThread->next = tdata;
        gLastThread = tdata;
    }
    pthread_mutex_unlock(&gThreadDataMutex);
    assert(tdata);
    return tdata;
}
#define CURRENT_THREAD      ((get_current_thread()))


// 送信用バッファ
free_stride_vector<MethodNodeSerializedInfo>* gBackBuffer_SerializedNodeInfoArray;




static MethodNodeSerializedInfo *GetSerializedNodeInfo(unsigned int call_node_id);
static MethodNodeInfo *GetNodeInfo(unsigned int call_node_id);



template <class T>
typename T::value_type *new_tail_elem(T &arr)
{
    arr.resize(arr.size() + 1);
    return &arr[arr.size() - 1];
}


inline unsigned int GetChildNodeID(ThreadInfo *ti, nameid_t nameid, void *name_data_ptr)
{
    unsigned int parent_id = ti->CurrentCallNodeID;
	MethodNodeInfo *node_info = &ti->NodeInfoArray[parent_id];
    children_t::iterator iter = node_info->children->find(nameid);
	if(iter == node_info->children->end())
		return ti->AddCallNode(parent_id, nameid, name_data_ptr);
	return (*iter).second;
}


void AddActualRecord(unsigned int cnid)
{
    ThreadInfo *ti = CURRENT_THREAD;

    MethodNodeSerializedInfo *sinfo = new_tail_elem(*ti->SerializedNodeInfoArray);

    MethodNodeInfo *call_node = &ti->NodeInfoArray[cnid];
    call_node->serialized_node_index = ti->SerializedNodeInfoArray->size() - 1;
    call_node->generation_number = ti->GenerationNumber;
    
	sinfo->call_node_id = cnid;
	sinfo->parent_node_id = call_node->parent_node_id;
	sinfo->nameid = call_node->nameid;
    memset(sinfo->profile_value, 0, g_active_records.size() * sizeof(profile_value_t));
    sinfo->call_count = 0;


}

static MethodNodeSerializedInfo *GetSerializedNodeInfo(unsigned int call_node_id)
{
    ThreadInfo *ti = CURRENT_THREAD;

    pthread_mutex_lock(&ti->DataMutex);
    MethodNodeInfo &call_node = ti->NodeInfoArray[call_node_id];
    if(call_node.generation_number != ti->GenerationNumber)
        AddActualRecord(call_node_id);
    MethodNodeSerializedInfo *ret = &(*ti->SerializedNodeInfoArray)[call_node.serialized_node_index];
    pthread_mutex_unlock(&ti->DataMutex);
    return ret;
}

static MethodNodeSerializedInfo *GetSerializedNodeInfoNoAdd(unsigned int call_node_id)
{
    ThreadInfo *ti = CURRENT_THREAD;
    pthread_mutex_lock(&ti->DataMutex);
    MethodNodeInfo &call_node = ti->NodeInfoArray[call_node_id];
    if(call_node.generation_number != ti->GenerationNumber)
        return NULL;
    MethodNodeSerializedInfo *ret = &(*ti->SerializedNodeInfoArray)[call_node.serialized_node_index];
    pthread_mutex_unlock(&ti->DataMutex);
    return ret;
}

static MethodNodeInfo *GetNodeInfo(unsigned int call_node_id)
{
    ThreadInfo* ti = CURRENT_THREAD;
    MethodNodeInfo* call_node = &ti->NodeInfoArray[call_node_id];
    return call_node;
}

/*
inline void get_current_node_info_pair(ThreadInfo *ti, MethodNodeInfo *&ninfo, MethodNodeSerializedInfo *&sinfo)
{
    sinfo = GetSerializedNodeInfo(ti->CurrentCallNodeID);
    ninfo = GetNodeInfo(ti->CurrentCallNodeID);
}

*/

inline void get_current_node_info_pair(ThreadInfo *ti, MethodNodeInfo *&ninfo, MethodNodeSerializedInfo *&sinfo)
{
    pthread_mutex_lock(&ti->DataMutex);
    ninfo = &ti->NodeInfoArray[ti->CurrentCallNodeID];
    if(ninfo->generation_number != ti->GenerationNumber)
        AddActualRecord(ti->CurrentCallNodeID);
    sinfo = &(*ti->SerializedNodeInfoArray)[ninfo->serialized_node_index];
    pthread_mutex_unlock(&ti->DataMutex);
}


    

unsigned int ThreadInfo::AddCallNode(unsigned int parent_node_id, nameid_t nameid, void *name_info_ptr)
{
    MethodNodeInfo *call_node = new_tail_elem(NodeInfoArray);
    call_node->serialized_node_index = 0;
    call_node->generation_number = 0;
    call_node->nameid = nameid;
    call_node->children = new children_t();
    
    GetNameIDTable()->AddCB(nameid, name_info_ptr);
    
    call_node->parent_node_id = parent_node_id;
    if(parent_node_id != 0)
    {
        GetNodeInfo(parent_node_id)->children->insert(make_pair(call_node->nameid, NodeInfoArray.size() - 1));
    }

    return NodeInfoArray.size() - 1;
}




void llprof_call_handler(nameid_t nameid, void *name_info)
{
    ThreadInfo* ti = CURRENT_THREAD;

	assert(ti->stop == 0);
	ti->stop = 1;

    unsigned int before = ti->CurrentCallNodeID;
    ti->CurrentCallNodeID = GetChildNodeID(ti, nameid, name_info);
    

    //MethodNodeSerializedInfo sinfo_data;
    //MethodNodeSerializedInfo *sinfo = &sinfo_data;

    MethodNodeSerializedInfo *sinfo;
    MethodNodeInfo *ninfo;
    get_current_node_info_pair(ti, ninfo, sinfo);

    sinfo->call_count++;
    llprof_rtype_start_node(sinfo->profile_value);
    memcpy(ninfo->start_value, sinfo->profile_value, g_active_records.size() * 8);
    

    
    
    
	ti->stop = 0;
}


void llprof_icl_profile_value(int record_type_index, profile_value_t value)
{
#ifdef LLPROF_DEBUG
    assert(record_type_index < g_records.size());
#endif
    pvtype_t &pvr = g_records[record_type_index];
    
    if(pvr.record_index != -1)
    {
        ThreadInfo* ti = CURRENT_THREAD;
        MethodNodeSerializedInfo *sinfo;
        MethodNodeInfo *ninfo;
        get_current_node_info_pair(ti, ninfo, sinfo);
        sinfo->profile_value[pvr.record_index] += value;
    }
}


void llprof_return_handler()
{
    ThreadInfo* ti = CURRENT_THREAD;
    // Rubyのバグ？
    // rrprofのrequire終了時にも呼ばれる(バージョンがある)ようなのでスキップ

    if(ti->CurrentCallNodeID == 1)
    {
        return;
    }
    
	assert(ti->stop == 0);
	ti->stop = 1;
    MethodNodeSerializedInfo *sinfo;
    MethodNodeInfo *ninfo;

    get_current_node_info_pair(ti, ninfo, sinfo);
    
    
    llprof_rtype_end_node(ninfo->start_value, sinfo->profile_value);

    ti->CurrentCallNodeID = sinfo->parent_node_id;
#ifdef LLPROF_DEBUG
    assert(ti->CurrentCallNodeID != 0);
#endif



	ti->stop = 0;	
}


void print_tree(unsigned int id, int indent);


typedef struct
{
	int indent;
} print_tree_prm_t;


void BufferIteration_Initialize(ThreadIterator *iter)
{
    iter->current_thread = gFirstThread;
    iter->phase = 0;
    iter->got_flag = 0;
}

int BufferIteration_NextBuffer(ThreadIterator *iter)
{
    iter->got_flag = 0;
    if(!iter->current_thread)
        return 0;
    if(iter->phase == 0)
    {
        iter->phase = 1;
        return 1;
    }
    if(iter->phase == 1)
    {
        iter->phase = 2;
        return 1;
    }
    if(iter->phase == 2)
    {
        iter->phase = 1;
        iter->current_thread = iter->current_thread->next;
        if(!iter->current_thread)
            return 0;
        return 1;
    }
    assert(0);
    return 0;
}


void CallTree_GetSerializedBuffer(ThreadInfo *thread, void **buf, unsigned int *size)
{
    pthread_mutex_lock(&thread->DataMutex);

    swap(thread->SerializedNodeInfoArray, gBackBuffer_SerializedNodeInfoArray);
    thread->GenerationNumber++;
    thread->SerializedNodeInfoArray->resize(0);

	*buf = gBackBuffer_SerializedNodeInfoArray->start_pointer();
    *size = gBackBuffer_SerializedNodeInfoArray->buffer_size();
    
    thread->NowInfo[0] = thread->CurrentCallNodeID;
    
    pthread_mutex_unlock(&thread->DataMutex);
}



void CallTree_GetNowInfo(ThreadInfo *thread, void **buf, unsigned int *size)
{
    llprof_rtype_start_node(thread->NowInfo+1);
 	*buf = thread->NowInfo; // [0]には現在のCNIDが入っている
	*size = (g_active_records.size()+1) * sizeof(profile_value_t);
}

void BufferIteration_GetBuffer(ThreadIterator *iter, void **buf, unsigned int *size)
{
    assert(iter->got_flag == 0);
    iter->got_flag = 1;
    if(iter->phase == 1)
    {
        CallTree_GetSerializedBuffer(iter->current_thread, buf, size);
        return;
    }
    else if(iter->phase == 2)
    {
        CallTree_GetNowInfo(iter->current_thread, buf, size);
        return;
    }
    assert(0);
}

unsigned long long BufferIteration_GetThreadID(ThreadIterator *iter)
{
    return iter->current_thread->ThreadID;
}

int BufferIteration_GetBufferType(ThreadIterator *iter)
{
    if(iter->phase == 1)
    {
        return BT_PERFORMANCE;
    }
    if(iter->phase == 2)
    {
        return BT_NOWINFO;
    }
    if(iter->phase == 3)
    {
        return BT_STACK;
    }
    assert(0);
    return 0;
}


void llprof_calltree_init()
{
    pthread_mutex_init(&gThreadDataMutex, NULL);
    pthread_key_create(&gCurrentThreadKey, NULL);


    
    gBackBuffer_SerializedNodeInfoArray = new free_stride_vector<MethodNodeSerializedInfo>();
    gBackBuffer_SerializedNodeInfoArray->set_extra_stride(g_active_records.size() * sizeof(profile_value_t));
    get_current_thread();
}


