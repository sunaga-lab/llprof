
#include <ruby/ruby.h>
#include <assert.h>
#include <time.h>
#include <errno.h>

#include "llprof.h"
#include <iostream>
#include <sstream>
using namespace std;

// #define PROFILE_C_CALL

struct ruby_name_info_t{
    VALUE klass;
    ID id;
};

const int NAMEBUF_SIZE = 64;

const char *rrprof_name_func(nameid_t nameid, void *ptr)
{
	ruby_name_info_t *name_info_ptr = (ruby_name_info_t *)ptr;
    if(!name_info_ptr)
        return "(null)";

	if(!name_info_ptr->klass && !name_info_ptr->id)
        return "(null)";

	//cout << "Get Name: " << nameid << " ptr:" << name_info_ptr << " ID:" << name_info_ptr->id
	//		<< " KLASS:" << name_info_ptr->klass << endl;

	const char *klass_str = rb_class2name(name_info_ptr->klass);
	//cout << "klass_str:" << klass_str << endl;
	const char *id_str = rb_id2name(name_info_ptr->id);
	//cout << "id_str:" << id_str << endl;

	char *name = new char[NAMEBUF_SIZE];
	snprintf(
		name, NAMEBUF_SIZE, "%s::%s", klass_str, id_str
	);

	// cout << "Got Name: " << name << endl;
    return name;
}

inline nameid_t nameinfo_to_nameid(const ruby_name_info_t &nameinfo)
{
    return (unsigned long long)nameinfo.klass * (unsigned long long)nameinfo.id;
}

void rrprof_calltree_call_hook(rb_event_flag_t event, VALUE data, VALUE self, ID p_id, VALUE p_klass)
{
    ruby_name_info_t ruby_name_info;
    if(event == RUBY_EVENT_C_CALL)
    {
        ruby_name_info.id = p_id;
        ruby_name_info.klass = p_klass;
    }
    else
	{
        if(!rb_frame_method_id_and_class(&ruby_name_info.id, &ruby_name_info.klass))
		{
			ruby_name_info.id = 0;
			ruby_name_info.klass = 0;
		}
	}
    nameid_t nameid = nameinfo_to_nameid(ruby_name_info);
    llprof_call_handler(nameid, (void *)&ruby_name_info);
}


void rrprof_calltree_ret_hook(rb_event_flag_t event, VALUE data, VALUE self, ID p_id, VALUE p_klass)
{
    llprof_return_handler();
}

extern "C" 
void Init_rrprof(void)
{
    llprof_add_counter_pv("time", "Time:ns", get_time_now_nsec);
    llprof_set_name_func(rrprof_name_func);

    llprof_set_record_string(getenv("LLPROF_RECORDS"));
    llprof_init();
    
    VALUE rrprof_mod = rb_define_module("RRProf");

#ifdef PROFILE_C_CALL
    rb_add_event_hook(&rrprof_calltree_call_hook, RUBY_EVENT_CALL | RUBY_EVENT_C_CALL, Qnil);
    rb_add_event_hook(&rrprof_calltree_ret_hook, RUBY_EVENT_RETURN | RUBY_EVENT_C_RETURN, Qnil);
#else
    rb_add_event_hook(&rrprof_calltree_call_hook, RUBY_EVENT_CALL, Qnil);
    rb_add_event_hook(&rrprof_calltree_ret_hook, RUBY_EVENT_RETURN, Qnil);
#endif
}

