
#include <iostream>
using namespace std;

#include "php_llprofpm.h"

#include <stdlib.h>
#include <unistd.h>
#include "llprof.h"

static void (*_zend_execute) (zend_op_array *ops TSRMLS_DC);
const char *php_name_func(nameid_t nameid, void *p);

//----------------------------------------------------------------------
// from XHProf
//----------------------------------------------------------------------

static const char *hp_get_base_filename(char *filename) {
  char *ptr;
  int   found = 0;

  if (!filename)
    return "";

  /* reverse search for "/" and return a ptr to the next char */
  for (ptr = filename + strlen(filename) - 1; ptr >= filename; ptr--) {
    if (*ptr == '/') {
      found++;
    }
    if (found == 2) {
      return ptr + 1;
    }
  }

  /* no "/" char found, so return the whole string */
  return filename;
}



static char *hp_get_function_name(zend_op_array *ops TSRMLS_DC) {
  zend_execute_data *data;
  char              *func = NULL;
  char              *cls = NULL;
  char              *ret = NULL;
  int                len;
  zend_function      *curr_func;

  data = EG(current_execute_data);

  if (data) {
    /* shared meta data for function on the call stack */
    curr_func = data->function_state.function;

    /* extract function name from the meta info */
    func = curr_func->common.function_name;

    if (func) {
      /* previously, the order of the tests in the "if" below was
       * flipped, leading to incorrect function names in profiler
       * reports. When a method in a super-type is invoked the
       * profiler should qualify the function name with the super-type
       * class name (not the class name based on the run-time type
       * of the object.
       */
      if (curr_func->common.scope) {
        cls = curr_func->common.scope->name;
      } else if (data->object) {
        cls = Z_OBJCE(*data->object)->name;
      }

      if (cls) {
        len = strlen(cls) + strlen(func) + 10;
        ret = (char*)emalloc(len);
        snprintf(ret, len, "%s::%s", cls, func);
      } else {
        ret = estrdup(func);
      }
    } else {
      long     curr_op;
      int      desc_len;
      char    *desc;
      int      add_filename = 0;

      /* we are dealing with a special directive/function like
       * include, eval, etc.
       */
      curr_op = data->opline->op2.u.constant.value.lval;
      switch (curr_op) {
        case ZEND_EVAL:
          func = "eval";
          break;
        case ZEND_INCLUDE:
          func = "include";
          add_filename = 1;
          break;
        case ZEND_REQUIRE:
          func = "require";
          add_filename = 1;
          break;
        case ZEND_INCLUDE_ONCE:
          func = "include_once";
          add_filename = 1;
          break;
        case ZEND_REQUIRE_ONCE:
          func = "require_once";
          add_filename = 1;
          break;
        default:
          func = "???_op";
          break;
      }

      /* For some operations, we'll add the filename as part of the function
       * name to make the reports more useful. So rather than just "include"
       * you'll see something like "run_init::foo.php" in your reports.
       */
      if (add_filename){
        const char *filename;
        int   len;
        filename = hp_get_base_filename((curr_func->op_array).filename);
        len      = strlen("run_init") + strlen(filename) + 3;
        ret      = (char *)emalloc(len);
        snprintf(ret, len, "run_init::%s", filename);
      } else {
        ret = estrdup(func);
      }
    }
  }
  return ret;
}


//----------------------------------------------------------------------
const char *php_name_func(nameid_t nameid, void *p)
{
    if(!nameid)
        return "(null)";
    if(p)
        return (char *)p;

    return "(invalid)";
}


//----------------------------------------------------------------------

void hp_execute (zend_op_array *ops TSRMLS_DC) {
  char *func = NULL;
  int hp_profile_flag = 1;

  func = hp_get_function_name(ops TSRMLS_CC);
  if (!func) {
    cout << "NULL Name " << endl;
    _zend_execute(ops TSRMLS_CC);
    return;
  }

  cout << "Begin: " << func << " ops:" << (void *)ops << endl;
  llprof_call_handler((nameid_t)ops, func);
  
  _zend_execute(ops TSRMLS_CC);
  //if (hp_globals.entries) {
  llprof_return_handler();
      
  cout << "End:" << func << endl;

  efree(func);
}


void initialize_llprof_hook()
{
    cout << "LLPROF Start" << endl;
    llprof_set_time_func(get_time_now_nsec);
    llprof_set_name_func(php_name_func);
    llprof_init();
    _zend_execute = zend_execute;
    zend_execute  = hp_execute;
}
