#ifndef DATA_STRUCT_H
#define DATA_STRUCT_H

#include <stdlib.h>
#include <iostream>
#include <map>
#include <tr1/unordered_map>
using namespace std;



#ifdef USE_UNORDERD_MAP
    typedef std::tr1::unordered_map<nameid_t, unsigned int> children_t;

    inline children_t *create_children_map()
    {
        return new children_t(2);
    }
#else
    typedef std::map<nameid_t, unsigned int> children_t;

    inline children_t *create_children_map()
    {
        return new children_t();
    }

#endif

const int ALLOCATE_FACTOR = 2;

template <typename T>
class free_stride_vector
{
    int stride_;
    void *buffer_;
    int capacity_;
    int size_;
    void reallocate(int size)
    {
        assert(stride_ > 0);
        buffer_ = realloc(buffer_, size * stride_);
    }
    
public:
    typedef T value_type;

    free_stride_vector()
    {
        stride_ = 0;
        buffer_ = NULL;
        size_ = 0;
        capacity_ = 0;
        
    }
    
    ~free_stride_vector()
    {
    }
    
    void set_stride(int stride)
    {
        stride_ = stride;
        assert(stride_ > 0);
        assert(!buffer_);
    }

    void set_extra_stride(int extra_stride)
    {
        set_stride(extra_stride + sizeof(T));
    }

    
    void resize(int n)
    {
        if(n > capacity_)
        {
            if(n <= capacity_ * ALLOCATE_FACTOR)
                reallocate(capacity_ * ALLOCATE_FACTOR);
            else
                reallocate(n);
        }
        size_ = n;
        return;
    }
    
    void reserve(int n)
    {
        if(capacity_ < n)
            reallocate(n);
    }
    
    inline void *start_pointer()
    {
        return buffer_;
    }

    ssize_t buffer_size()
    {
        return size_ * stride_;
    }
    
    bool empty()
    {
        return !buffer_ || size_ == 0;
    }
    
    ssize_t size()
    {
        return size_;
    }
    
    inline T &operator[](int index)
    {
        return *(T *)((char *)buffer_ + (index * stride_));
    }
};










#endif // DATA_STRUCT_H
