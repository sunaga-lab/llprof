
SRCS = llprofpm.cpp \
	../llprofcommon/call_tree.cpp ../llprofcommon/class_table.cpp \
	 ../llprofcommon/llprof.cpp ../llprofcommon/measurement.cpp \
	 ../llprofcommon/network.cpp ../llprofcommon/server.cpp

OUTNAME = llprofpm.so

CXXFLAGS = -fPIC -I. \
	-I../llprofcommon

LDFLAGS = -shared -fPIC

all: $(OUTNAME)

$(OUTNAME): $(SRCS:.cpp=.o)
	gcc -o $(OUTNAME) $(LDFLAGS) $(SRCS:.cpp=.o) -lpthread -lrt -lstdc++



.cpp.o:
	g++ -c -o $@ $(CXXFLAGS) $<

