
add_panel("list", {
    
    init: function()
    {
        this.namecol = {
            width: 400
        };
        
        this.col = [
            {idx: g_target_pv_index, mode: "all", width: 140},
            {idx: g_target_pv_index, mode: "self", width: 140}
        ];
        $("#mainpanel").html("<table id='mtbl_header'></table><div id='mtbl_scroll'><table id='mtbl'></table></div>");
        $('#mtbl_scroll').css('overflow', 'scroll');
        
    },

    update_column: function()
    {
        $('#mtbl_header').html("<th id='lhead_name'>name</th>");
        $("#list_body_head").html("<th id='lbodyhead_name'></th>");
        
        $('#lhead_name').width(this.namecol.width);
        $('#lbodyhead_name').width(this.namecol.width);
        for(var i = 0; i < this.col.length; i++)
        {
            var col = this.col[i];
            var fname = g_metadata[col.idx] ? g_metadata[col.idx].field_name : "Noname";
            $('#mtbl_header').append("<th id='lhead_"+i+"'>" + fname + "(" + col.mode + ")</th>");
            $("#lhead_"+i).width(col.width);
            $("#list_body_head").append("<th id='lbodyhead_"+i+"'> </th>");
            $("#lbodyhead_"+i).width(col.width);
        }
        
        
        this.update_view();
    },

    tree_reload: function()
    {
        this.list = {};
        this.ordered = [];
        this.num_items = 0;
        this.unordered = [];
        $('#mtbl').html("<tr id='list_body_head'></tr>");
        
        
        for(var thread_id in g_target_cct)
        {
            var thread = g_target_cct[thread_id];
            for(var key in thread.nodes)
            {
                var node = thread.nodes[key];
                this.update_item(thread, node);
            }
        }
        this.update_column();
    },

    update_size: function()
    {
        var mp = $('#mainpanel');
        $('#mtbl_scroll').height(mp.height());
        $('#mtbl_scroll').width(mp.width());
    },
    
    update_item: function(thread, node)
    {
        var thread_id = thread.id;
        var item_id = "li_" + thread_id + "_" + node.name;
        
        if(!(item_id in this.list))
        {
            var node_stock = this.list[item_id] = {
                name: node.name,
                id: node.id,
                all: new Array(g_metadata.length),
                cld: new Array(g_metadata.length),
                opos: -2
            };
            for(var i = 0; i < g_metadata.length; i++)
                node_stock.all[i] = node_stock.cld[i] = 0;
            this.unordered.push(node_stock);
            this.num_items++;
            $('#mtbl').append("<tr class='list_item' id='tbl_"+(this.num_items-1)+"'><td>0</td></tr>");
        }
        else
        {
            node_stock = this.list[item_id];
            if(node_stock.opos >= 0)
            {
                assert(this.ordered[node_stock.opos].id == node_stock.id, "Id not match");
                node_stock.opos = -1;
            }
        }
        accumurate(node_stock, node, thread);
    },

    merge_orderd: function()
    {
        var cmp_func = function(a,b) {return -(a.all[0] - b.all[0]);};

        for(var i = 0; i < this.ordered.length; i++)
        {
            if(this.ordered[i].opos < 0)
            {
                this.unordered.push(this.ordered[i]);
                this.ordered.splice(i, 1);
                i--;
            }
        }

        this.unordered.sort(cmp_func);
        for(var i = 0; i < this.ordered.length; i++)
        {
            if(this.unordered.length > 0 && cmp_func(this.ordered[i], this.unordered[0]) > 0)
            {
                this.ordered.splice(i, 0, this.unordered.shift());
            }
            this.ordered[i].opos = i;
        }
        while(this.unordered.length != 0)
        {
            var node_stock = this.unordered.shift();
            node_stock.opos = this.ordered.length;
            this.ordered.push(node_stock);
        }

    },

    scroll_padding: 20,
    
    
    update_view: function()
    {
        this.merge_orderd();

        $('.list_item').css('background-color', '#DDD');
        
        var h = $('.list_item:first').height();
        
        var istart = Math.floor($('#mtbl_scroll').scrollTop() / h) - this.scroll_padding;
        var iend = Math.floor(($('#mtbl_scroll').scrollTop() + $('#mtbl_scroll').height()) / h) + this.scroll_padding;
        istart = Math.max(istart, 0);
        iend = Math.min(iend, this.ordered.length);
        iend = Math.min(iend, istart+100);
        for(var i = istart; i <= iend; i++)
        {
            $('#tbl_' + i).css("background-color", "white");

            var node_stock = this.ordered[i];
            var html = "<td>" + (node_stock ? node_stock.name : "Unknown")+ "</td>";

            for(var j = 0; j < this.col.length; j++)
            {
                var col = this.col[j];
                html += "<td class='number'>";
                
                // get_profile_value_** は使わない
                //  -> accumurateで既につかってる
                if(col.mode == "all")
                {
                    if(node_stock && node_stock.all && node_stock.all[col.idx])
                        html += node_stock.all[col.idx];
                }
                else if(col.mode == "self")
                {
                    var v = (node_stock.all[col.idx] - node_stock.cld[col.idx]);
                    if(v < 0)
                        v = -1;
                    html += v;
                }
                html += "</td>";
            }
            $('#tbl_' + i).html(html);
        }
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
                Panels.list.update_item(updated[thread_id], node);
                
            }
        }
        this.update_view();
    },
    
    hide: function()
    {
        
    }
});
