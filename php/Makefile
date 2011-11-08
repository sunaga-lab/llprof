

SRCS = llprofpm_main.cpp llprof_php.cpp \
	../llprofcommon/call_tree.cpp ../llprofcommon/class_table.cpp \
	 ../llprofcommon/llprof.cpp ../llprofcommon/measurement.cpp \
	 ../llprofcommon/network.cpp ../llprofcommon/server.cpp

OUTNAME = llprofpm.so

CXXFLAGS = -fPIC -I. \
	-I../llprofcommon \
	-I/usr/lib64/php5.3/include/php -I/usr/lib64/php5.3/include/php/main \
	-I/usr/lib64/php5.3/include/php/TSRM \
	-I/usr/lib64/php5.3/include/php/Zend \
	-I/usr/lib64/php5.3/include/php/ext \
	-I/usr/lib64/php5.3/include/php/ext/date/lib

LDFLAGS = -DPHP_ATOM_INC -shared -fPIC -DPIC  -Wl,-soname -Wl,llprofpm.so 

all: $(OUTNAME)

$(OUTNAME): $(SRCS:.cpp=.o)
	gcc -o $(OUTNAME) $(LDFLAGS) $(SRCS:.cpp=.o) -lpthread -lrt -lstdc++



.cpp.o:
	g++ -c -o $@ $(CXXFLAGS) $<

