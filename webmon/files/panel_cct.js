

add_panel("cct",{
    init: function()
    {
        if(!this.open_nodes)
            this.open_nodes = {};
    },
    tree_reload: function()
    {
        $("#mainpanel").html("<div id='cct_outer'><div id='cct_inner'></div></div>");
        this.cct_dict = {};
        for(var thread_id in g_target_cct)
        {
            var thread_elem = Panels.cct.get_thread_elem(thread_id);
            for(var key in g_target_cct[thread_id].nodes)
            {
                var node = g_target_cct[thread_id].nodes[key];
                var node_elem = Panels.cct.get_node_elem(thread_id, node.id, true, node.pid);
                Panels.cct.update_label(node_elem);
            }
        }
        this.last_opened = null;
        this.update_size();
    },

    get_thread_elem: function(thread_id)
    {
        var thread_elem = $("#th_" + thread_id);
        if(thread_elem.length == 0)
        {
            $("#cct_inner").append("<div class='treenode' id='th_" + thread_id + "'><div class='nodelabel'></div><div class='children'></div></div>");
            thread_elem = $("#th_" + thread_id);
            thread_elem.attr("threadid", thread_id);
        }
        thread_elem.children(".nodelabel").html("Thread: " + thread_id);
        return thread_elem;
    },
    
    get_node_elem: function(thread_id, node_id, auto_add, parent_node_id)
    {
        var node_elem_id = "node_th_" + thread_id + "_" + node_id;
        
        if(node_elem_id in this.cct_dict)
        {
            return $("#" + node_elem_id);
        }
        if(auto_add)
        {
            var parent_elem;
            if(parent_node_id == THREAD_NODE_ID)
            {
                parent_elem = Panels.cct.get_thread_elem(thread_id);
                if(parent_elem.children(".children").length == 0)
                    return null;
            }
            else
            {
                var pnode_elem_id = "#node_th_" + thread_id + "_" + parent_node_id;
                if(!(pnode_elem_id in this.cct_dict) || this.cct_dict[pnode_elem_id] != 2)
                    return null;
                
                parent_elem = $(pnode_elem_id);
            }
            node_elem = Panels.cct.add_node(parent_elem, thread_id, node_id);
            return node_elem;
        }
        else
            return null;
    },
    
    update_thread_label: function(thread_elem)
    {
        if(!thread_elem || thread_elem.length == 0)
            return;
        var thread = g_target_cct[thread_elem.attr('threadid')];
        thread_elem.children(".nodelabel").html("Thread: " + thread.id); 
            // + " Running:" + thread.running_node + " NowValue:" + thread.now_values.join(', '));
    },
    
    update_label: function(node_elem)
    {
        if(!node_elem || node_elem.length == 0)
            return;
        var thread = g_target_cct[node_elem.attr('threadid')];
        var node = thread.nodes[node_elem.attr('nodeid')];
        
        // todo: adhoc
        var sval;
        if(g_target_pv_index == 0)
            sval = get_profile_value_all(thread, node, 0) / (1000 * 1000 * 1000);
        else
            sval = get_profile_value_all(thread, node, g_target_pv_index);
        node_elem.children(".nodelabel").html(
            "<img src='/files/"+(node.running?"running":"normal")+".png' />"
               + sval + " " + html_esc(node.name) + " (id="+node.id+" c=" + node.cc + ")");
        //     + (node.id < 10000 ? (node.id + ":"): "") + html_esc(node.name) + " " + sval + "(cc:" + node.cc + ")");
        
        // node_elem.children(".nodelabel").html("Node:" + html_esc(node.name) + " v: " + node.all + ";  " + node.cld);
    },

    update_size: function()
    {
        $("#cct_outer")
            .width($("#mainpanel").width()-4)
            .height($("#mainpanel").height()-4);
    },

    update: function(updated)
    {
        for(var thread_id in updated)
        {
            var thread_elem = Panels.cct.get_thread_elem(thread_id);
            Panels.cct.update_thread_label(thread_elem);
            for(var j = 0; j < updated[thread_id].nodes.length; j++)
            {
                var node = updated[thread_id].nodes[j];
                var node_elem = Panels.cct.get_node_elem(thread_id, node.id, true, node.pid);
                Panels.cct.update_label(node_elem);

            }
        }

    },
    
    add_node: function(parent_elem, thread_id, node_id){
        var node_elem_id = "node_th_" + thread_id + "_" + node_id;
        parent_elem.children(".children").append("<div class='treenode' id='" + node_elem_id + "'><div class='nodelabel'></div></div>");
        this.cct_dict[node_elem_id] = 1;
        var node_elem = $("#" + node_elem_id);
        node_elem.attr("nodeid", node_id);
        node_elem.attr("threadid", thread_id);
        Panels.cct.update_label(node_elem);
        
        node_elem.children(".nodelabel")
            .click(function(e){
                    Panels.cct.open_node_elem($(this).parent()); 
                    e.preventDefault();
            })
            .mouseenter(function(e){
                $(this).addClass("nodelabel_hover");
            })
            .mouseleave(function(e){
                $(this).removeClass("nodelabel_hover");
            })
        ;
        if(node_id in this.open_nodes)
        {
            this.open_node_elem(node_elem);
        }
        return node_elem;
    },
    
    ids_to_elemid: function(thread_id, node_id)
    {
        return "node_th_" + thread_id + "_" + node_id;
    },

    elem_to_node_elemid: function(node)
    {
        return this.ids_to_elemid(node.attr("threadid"), node.attr("nodeid"));
    },
    
    open_node_elem: function(elem)
    {
        if(elem.children(".children").length != 0)
        {
            delete this.open_nodes[elem.attr("nodeid")];
            elem.children(".children").remove();
            this.cct_dict[this.elem_to_node_elemid(elem)] = 1;
            return;
        }
        elem.append("<div class='children'></div>");
        this.last_opened = {threadid: elem.attr("threadid"), nodeid: elem.attr("nodeid")};

        var thread_id = this.last_opened.threadid;
        var node = g_target_cct[thread_id].nodes[this.last_opened.nodeid];
        this.open_nodes[this.last_opened.nodeid] = node;
        this.cct_dict[this.ids_to_elemid(thread_id, this.last_opened.nodeid)] = 2;
        
        for(var id in node.cid)
        {
            var node_elem = Panels.cct.add_node(elem, thread_id, id);
        }
    },
    
    hide: function()
    {
        
    }
});

