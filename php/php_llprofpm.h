#ifndef PHP_LLPROFPM_H
#define PHP_LLPROFPM_H

extern "C" {
#include <php.h>

#define PHP_LLPROFPM_VERSION "1.0.0"

#include <php_ini.h>
#include <SAPI.h>
#include <ext/standard/info.h>
#include <Zend/zend_extensions.h>

extern zend_module_entry llprofpm_module_entry;
#define phpext_llprofpm_ptr &llprofpm_module_entry

PHP_MINIT_FUNCTION(llprofpm);
PHP_MSHUTDOWN_FUNCTION(llprofpm);
PHP_RINIT_FUNCTION(llprofpm);
PHP_RSHUTDOWN_FUNCTION(llprofpm);
PHP_MINFO_FUNCTION(llprofpm);

//#ifdef ZTS
#include "TSRM.h"
//#endif

#define FREE_RESOURCE(resource) zend_list_delete(Z_LVAL_P(resource))

#define PROP_GET_LONG(name)    Z_LVAL_P(zend_read_property(_this_ce, _this_zval, #name, strlen(#name), 1 TSRMLS_CC))
#define PROP_SET_LONG(name, l) zend_update_property_long(_this_ce, _this_zval, #name, strlen(#name), l TSRMLS_CC)

#define PROP_GET_DOUBLE(name)    Z_DVAL_P(zend_read_property(_this_ce, _this_zval, #name, strlen(#name), 1 TSRMLS_CC))
#define PROP_SET_DOUBLE(name, d) zend_update_property_double(_this_ce, _this_zval, #name, strlen(#name), d TSRMLS_CC)

#define PROP_GET_STRING(name)    Z_STRVAL_P(zend_read_property(_this_ce, _this_zval, #name, strlen(#name), 1 TSRMLS_CC))
#define PROP_GET_STRLEN(name)    Z_STRLEN_P(zend_read_property(_this_ce, _this_zval, #name, strlen(#name), 1 TSRMLS_CC))
#define PROP_SET_STRING(name, s) zend_update_property_string(_this_ce, _this_zval, #name, strlen(#name), s TSRMLS_CC)
#define PROP_SET_STRINGL(name, s, l) zend_update_property_stringl(_this_ce, _this_zval, #name, strlen(#name), s, l TSRMLS_CC)


PHP_FUNCTION(helloworld);
#if (PHP_MAJOR_VERSION >= 5)
ZEND_BEGIN_ARG_INFO_EX(helloworld_arg_info, ZEND_SEND_BY_VAL, ZEND_RETURN_VALUE, 0)
ZEND_END_ARG_INFO()
#else /* PHP 4.x */
#define helloworld_arg_info NULL
#endif

} // extern "C" 

void initialize_llprof_hook();


#endif /* PHP_LLPROFPM_H */

