#ifndef RECORD_TYPE_H
#define RECORD_TYPE_H



inline void llprof_rtype_init(profile_value_t *value)
{
    value[0] = 0;
    value[1] = 1;
    value[2] = 0;
}

inline void llprof_rtype_metainfo(rtype_metainfo_t *metainfo)
{
    metainfo->add(0, "time", "ns", "A");
    metainfo->add(1, "start_timw", "ns", "S");
    metainfo->add(2, "memory", "byte", "");
}



#endif
