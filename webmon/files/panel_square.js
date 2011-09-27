
add_panel("square", {
    
    depth_value: 5,
    
    init: function()
    {
        this.update_timer_enabled = false;
        if(!this.open_nodes)
            this.open_nodes = {};

        $("#mainpanel").html("<div id='sqv_ctrl'><div id='sq_depth_bar'></div></div><div id='sqv_parent'></div>");
        $("#sqv_ctrl")
            .height(30)
        ;
        $('#sq_depth_bar').slider({
            min: 2,
            max: 30,
            value: this.depth_value,
            slide: function(e, ui){
                if(!Panels.square.update_timer_enabled)
                {
                    Panels.square.update_timer_enabled = true;
                    setTimeout(function(){Panels.square.update_sq();}, 500);
                }
            }
        });

    },

    tree_reload: function()
    {
        this.update_sq();
    },

    update_sq: function()
    {
        $('#debug2').html("");
        $("#sqv_parent")
            .css("position", "relative")
            .width($("#mainpanel").width())
            .height($("#mainpanel").height() - 30)
        ;
        var sq_dom = $("<div />");
        sq_dom
            .width($("#mainpanel").width())
            .height($("#mainpanel").height() - 30)
        ;
        
        if(!g_target_cct || !("0" in g_target_cct))
        {
            return;
        }
        
        var thread = g_target_cct["0"];
        if(!thread)
            return;
        var root = thread.nodes[ROOT_NODE_ID];
        if(!root)
            return;

        this.draw({
            target_elem: sq_dom,
            thread: thread,
            node: root,
            x: 0,
            y: 0,
            w: $("#sqv_parent").width(),
            h: $("#sqv_parent").height(),
            z: 0,
            depth: 0,
            color: 0,
            max_depth: $('#sq_depth_bar').slider("option", "value"),
        });
        
        this.depth_value = $('#sq_depth_bar').slider("option", "value");
        $("#sqv_parent").html("");
        $("#sqv_parent").append(sq_dom);
    },
    
    update_size: function()
    {
        
    },

    draw: function(data)
    {
        // $('#debug2').append("rect: " + data.x + ", " + data.y + ", " + data.w + ", " + data.h + ";<br />");
        if(data.depth >= data.max_depth)
            return;

        var current_node_pv = get_profile_value_all(data.thread, data.node, g_target_pv_index);
        
        var elem = $("<div class='sqv_sq' id='node_" + data.node.id + "'> </div>");
        elem
            .css("left", data.x)
            .css("top", data.y)
            .css("z-index", data.z)
            .css("background-color", g_colors[data.color % g_colors.length])
            .width(data.w)
            .height(data.h)
            .html(data.node.name + " (ID:" + data.node.id + " PV:" + current_node_pv + ")")
        ;
        data.target_elem.append(elem);

        var allval = 0.0;
        var values = {};
        for(var key in data.node.cid)
        {
            var cnode = data.node.cid[key];
            values[cnode.id] = get_profile_value_all(data.thread, cnode, g_target_pv_index);
            allval += values[cnode.id];
        }
        if(current_node_pv > allval)
            allval = current_node_pv;

        var psum = 0.0;
        var cur_color = data.color + 1;
        for(var key in data.node.cid)
        {
            var cnode = data.node.cid[key];
            var p = values[cnode.id] / allval;
            
            
            var next_data = {
                target_elem: data.target_elem,
                node: cnode,
                thread: data.thread,
                depth: data.depth,
                max_depth: data.max_depth,
                z: data.z + 1,
                color: cur_color
            };
            cur_color++;
            if(data.depth % 2 == 0)
            {
                next_data.x = data.x + data.w * psum;
                next_data.y = data.y;
                next_data.w = data.w * p;
                next_data.h = data.h;
            }
            else
            {
                next_data.x = data.x;
                next_data.y = data.y + data.h * psum;
                next_data.w = data.w;
                next_data.h = data.h * p;
            }
            next_data.depth += 1;
            next_data.x += 2;
            next_data.y += 2;
            next_data.w -= 4;
            next_data.h -= 4;
            if(next_data.w > 2 && next_data.h > 2)
                this.draw(next_data);
            psum += p;
            // assert(psum <= 1.1, "psum <= 1.1");
        }
    },

    

    update: function(updated)
    {
        this.update_sq();

    },
    
    
    hide: function()
    {
        
    }
});
