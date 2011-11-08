/*
   +----------------------------------------------------------------------+
   | This source file is subject to version 3.0 of the PHP license,       |
   | that is bundled with this package in the file LICENSE, and is        |
   | available through the world-wide-web at the following url:           |
   | http://www.php.net/license/3_0.txt.                                  |
   | If you did not receive a copy of the PHP license and are unable to   |
   | obtain it through the world-wide-web, please send a note to          |
   | license@php.net so we can mail you a copy immediately.               |
   +----------------------------------------------------------------------+
   | Authors: Takahiro Sunaga <sunagae@sunagae.net>                       |
   +----------------------------------------------------------------------+
*/

/* $ Id: $ */ 

#include "php_llprofpm.h"


/* {{{ llprofpm_functions[] */
function_entry llprofpm_functions[] = {
	PHP_FE(helloworld          , helloworld_arg_info)
	{ NULL, NULL, NULL }
};
/* }}} */


/* {{{ llprofpm_module_entry
 */
zend_module_entry llprofpm_module_entry = {
	STANDARD_MODULE_HEADER,
	"llprofpm",
	llprofpm_functions,
	PHP_MINIT(llprofpm),     /* Replace with NULL if there is nothing to do at php startup   */ 
	PHP_MSHUTDOWN(llprofpm), /* Replace with NULL if there is nothing to do at php shutdown  */
	PHP_RINIT(llprofpm),     /* Replace with NULL if there is nothing to do at request start */
	PHP_RSHUTDOWN(llprofpm), /* Replace with NULL if there is nothing to do at request end   */
	PHP_MINFO(llprofpm),
	PHP_LLPROFPM_VERSION, 
	STANDARD_MODULE_PROPERTIES
};
/* }}} */

ZEND_GET_MODULE(llprofpm)


PHP_MINIT_FUNCTION(llprofpm)
{
    initialize_llprof_hook();
	return SUCCESS;
}


/* {{{ PHP_MSHUTDOWN_FUNCTION */
PHP_MSHUTDOWN_FUNCTION(llprofpm)
{

	/* add your stuff here */

	return SUCCESS;
}
/* }}} */


/* {{{ PHP_RINIT_FUNCTION */
PHP_RINIT_FUNCTION(llprofpm)
{
	/* add your stuff here */

	return SUCCESS;
}
/* }}} */


/* {{{ PHP_RSHUTDOWN_FUNCTION */
PHP_RSHUTDOWN_FUNCTION(llprofpm)
{
	/* add your stuff here */

	return SUCCESS;
}
/* }}} */


/* {{{ PHP_MINFO_FUNCTION */
PHP_MINFO_FUNCTION(llprofpm)
{
	php_printf("LLProf Profiling Module for PHP\n");
	php_info_print_table_start();
	php_info_print_table_row(2, "Version",PHP_LLPROFPM_VERSION " (devel)");
	php_info_print_table_row(2, "Released", "2011-11-01");
	php_info_print_table_row(2, "CVS Revision", "$Id: $");
	php_info_print_table_row(2, "Authors", "Takahiro Sunaga 'sunagae@sunagae.net' (lead)\n");
	php_info_print_table_end();
	/* add your stuff here */

}
/* }}} */


PHP_FUNCTION(helloworld)
{
	if (ZEND_NUM_ARGS()>0)  {
		WRONG_PARAM_COUNT;
	}

    initialize_llprof_hook();

}
