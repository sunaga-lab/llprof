
g_current_target = null;
g_active_panel = null;
g_default_panel = null;
g_target_cct = {};
g_clear_cct = true;
g_now_info = {};
g_metadata = {};
g_target_pv_index = 0;

var THREAD_NODE_ID = 0;
var ROOT_NODE_ID = 1;

g_timenav = {
    real_time: true,
    select_time: 0,
    select_width: 0,
    max_time: 0
}

g_need_update_counter = 0;

g_colors = [
    "#FFE",
    "#FEF",
    "#EFF",
    "#EFE",
    "#EEF",
    "#FEE",
    "#FFC",
    "#FCF",
    "#CFF"
];


function assert(cond, msg)
{
    if(!cond)
    {
        alert("Assert failure: " + msg);
    }
}

function html_esc(s){
	s = s.replace("&",'&amp;');
	s = s.replace(">",'&gt;');
	s = s.replace("<",'&lt;');
	return s;
}




function count_update_counter()
{
    g_need_update_counter--;
    if(g_need_update_counter < 0)
    {
        g_need_update_counter = 5;
        update_ui();
    }
    else
    {
        setTimeout(count_update_counter, 200);
    }
}

function update_ui()
{
    $.ajax({
        type: "POST",
        url: "/ds/list",
        dataType: "json",
        data: {},
        success: update_ui_target_list
    });
}

function update_ui_target_list(data)
{
    fit_panel();
    for(var i = 0; i < data.length; i++)
    {
        if($("#target_item_" + data[i].id).length == 0)
        {
            $("#target_list tbody").append("<tr id='target_item_"+data[i].id+"'><td class='name'></td><td class='host'></td></tr>");
            
            var line = $("#target_item_" + data[i].id);
            line.attr("host_id", data[i].id);
            line.click(function(e){ show_target( $(this).attr("host_id")); });
        }
        var target_line = $("#target_item_" + data[i].id);
        
        target_line.children(".name").html(data[i].name);
        target_line.children(".host").html(data[i].host);
    }

    if(g_current_target)
    {
        if(g_timenav.real_time)
        {
            if(g_clear_cct)
            {
                g_target_cct = {};
                $.ajax({
                    type: "POST",
                    url: "/ds/tree/" + g_current_target + "/current",
                    data: {},
                    dataType: "json",
                    success: update_ui_data,
                });
            }
            else
            {
                $.ajax({
                    type: "POST",
                    url: "/ds/tree/" + g_current_target + "/diff/" + (g_timenav.max_time+1),
                    data: {},
                    dataType: "json",
                    success: update_ui_data,
                });
            }

        }else
        {
            if(!g_target_cct)
                g_target_cct = {};
            var start_tm = g_timenav.select_time+1;
            var end_tm = start_tm + g_timenav.select_width - 1;
            $.ajax({
                type: "POST",
                url: "/ds/tree/" + g_current_target + "/diff/" + start_tm + "/" + end_tm,
                data: {},
                dataType: "json",
                success: update_ui_data,
            });
        }
    }
    else
    {
        count_update_counter();
    }

}

function accumurate(dest, src, thread)
{
    for(var i = 0; i < src.all.length; i++)
    {
        if(g_metadata[i].flags.indexOf("S") != -1)
        {
            dest.all[i] = get_profile_value_all(thread, src, i);
            dest.cld[i] = get_profile_value_cld(thread, src, i);
        }
        else
        {
            dest.all[i] += get_profile_value_all(thread, src, i);
            dest.cld[i] += get_profile_value_cld(thread, src, i);
        }
    }
    dest.cc += src.cc;
}

function dprint(s)
{
    $('#debug2').append(s + "<br />");
}

function set_running_node(thread, flag)
{
    if(!("running_node" in thread))
        return;
    
    var id = thread.running_node;
    var arr = [];
    while(id in thread.nodes)
    {
        var node = thread.nodes[id];
        node.running = flag;
        id = node.pid;
    }
    
    return;
}

function fmt_date(d)
{
    yy = d.getYear();
    mm = d.getMonth() + 1;
    dd = d.getDate();
    hh = d.getHours();
    min = d.getMinutes();
    sec = d.getSeconds();
    if (yy < 2000) { yy += 1900; }
    if (mm < 10) { mm = "0" + mm; }
    if (dd < 10) { dd = "0" + dd; }
    return "" + yy + "/" + mm + "/" + dd + " " + hh + ":" + min + ":" + sec;
}

function update_ui_data(data)
{
    var updateStart = new Date();
    var update_threads = {};
    
    
    if(g_timenav.real_time)
    {
        g_timenav.max_time = data.timenum;
        update_time_nav({max: g_timenav.max_time-1});
    }
    else
    {
        g_target_cct = {};
    }
    g_metadata = [];
    for(var i = 0; i < data.numrecords; i++)
    {
        g_metadata[i] = data.metadata[i];
    }
    

    var timecaption_updated = false;
    for(var i = 0; i < data.threads.length; i++)
    {
        var thread = data.threads[i];
        var update_nodes_stocked = [];
        var update_nodes = [];
        
        if(!((thread.id) in g_target_cct))
        {
            g_target_cct[thread.id] = {id: thread.id, nodes: {}};
        }
        
        set_running_node(g_target_cct[thread.id], false);


        if(thread.now_values && thread.now_values.length != 0)
            g_target_cct[thread.id].now_values = thread.now_values;
        if(thread.start_values && thread.start_values.length != 0)
            g_target_cct[thread.id].start_values = thread.start_values;
        if( thread.running_node != 0)
            g_target_cct[thread.id].running_node = thread.running_node;

        if(!timecaption_updated)
        {
            timecaption_updated = true;
            if(thread.now_values[1])
            {
                var msval = parseInt(thread.now_values[1]) / 1000 / 1000;
                $('#timebar_timecaption').html(fmt_date(new Date(msval)));
            }
        }

        for(var j = 0; j < thread.nodes.length; j++)
        {
            var node = thread.nodes[j];
            var node_stock = g_target_cct[thread.id].nodes[node.id];
            if(!node_stock)
            {
                node_stock = {
                    id: node.id,
                    pid: node.pid,
                    cid: {},
                    name: node.name,
                    all: node.all,
                    cld: node.cld,
                    cc: node.cc,
                    running: false
                };
                g_target_cct[thread.id].nodes[node.id] = node_stock;
                if(node.pid != THREAD_NODE_ID)
                    g_target_cct["" + thread.id].nodes[node.pid].cid[node.id] = node_stock;
            }
            else
            {
                accumurate(node_stock, node);
            }
            update_nodes_stocked.push(node_stock);
            update_nodes.push(node);
        }

        set_running_node(g_target_cct[thread.id], true);

        update_threads[thread.id] = {
            nodes: update_nodes,
            nodes_stocked: update_nodes_stocked,
        };
    }
    var updateStartUpdatePanel = new Date();
    if(g_timenav.real_time)
    {
        update_main_panel(update_threads);
    }
    else
    {
        if(g_active_panel)
            Panels[g_active_panel].tree_reload();
    }
    var updateEnd = new Date();
    document.title =
        "Merge Time: " + (updateStartUpdatePanel - updateStart) + "ms "
        + " Pane:" + (updateEnd - updateStartUpdatePanel)
        + " nDiv:" + ($('div').length)
    ;
    count_update_counter();

    hide_pending();

}

function show_target(id)
{
    show_pending();
    g_clear_cct = true;

    g_current_target = id;
    g_timenav.max_time = 0;
    update_nav();
    fit_panel();

}



function update_main_panel(updated)
{
    if(g_active_panel)
    {
        Panels[g_active_panel].update(updated);
    }
}



function get_profile_value_all(thread, node, index)
{
    if(index != 0)
        return node.all[index];

    var val = node.all[0];
    if(node.running)
    {
        var node_start_time = node.all[1];
        if( node_start_time == 0)
            return node.all[0];
        
        if(!g_timenav.real_time && thread.start_values && node.all[1] < thread.start_values[1])
        {
            node_start_time = thread.start_values[1];
        }
        
        val += (thread.now_values[1] - node_start_time);
    }
    
    if(!g_timenav.real_time && thread.start_values && thread.now_values && val > (thread.now_values[1] - thread.start_values[1]))
         val = thread.now_values[1] - thread.start_values[1];
    return val;
}

function get_profile_value_cld(thread, node, index)
{
    return node.cld[index];
}

function get_profile_value_self(thread, node, index)
{
    return get_profile_value_all(thread, node, index) - get_profile_value_cld(thread, node, index);
}


Panels = {};

function add_panel(panel_name, paneldata)
{
    Panels[panel_name] = paneldata;
    if(!g_default_panel)
        g_default_panel = panel_name;
    
}




function fit_panel()
{
    var win_h = $(window).height();
    var win_w = $(window).width();

    $('#mainpanel').width(win_w - 200 - 10);
    $('#mainpanel').height(win_h - 100 - 10);

    $('#modepanel').width(win_w - 200 - 10);
    $('#modepanel').height(100);


    $('#sidepanel').width(200);
    $('#sidepanel').height(win_h - 10);
    
    if(g_active_panel)
        Panels[g_active_panel].update_size();
}

function do_command(cmd)
{
    var cmd = cmd.split(" ");
    
    if(cmd[0] == "g" && cmd.length >= 4)
    {
        g_active_panel = null;
        $('#mainpanel').html("Loading...");
        
        fetch_table_data({
            threadid: "0",
            //nodeid: cmd[1],
            start_time: parseInt(cmd[1]),
            end_time: parseInt(cmd[2]),
            timewidth: parseInt(cmd[3]),
            nodes: cmd[4].split(','),
            //depth: parseInt(cmd[5]),
            cb: function(req){
                var html = "<div style='padding-left: 80px;'><table id='charting_table'><tr><td></td>";
                
                var nkeys = req.keys_idx.length;
                if(nkeys >= 10)
                {
                    alert("Too many keys");
                    nkeys = 10;
                }
                
                for(var i = 0; i < nkeys; i++)
                {
                    html += "<th scope='col'>" + req.keys_idx[i].name + "</th>";
                }
                html += "</tr>";
                
                for(var i = 0; i < req.data.length; i++)
                {
                    html += "<tr><th scope='row'>"+i+"</th>";
                    for(var j = 0; j < nkeys; j++)
                    {
                        var key = req.keys_idx[j].id;
                        if(req.data[i][key])
                            html += "<td>" + get_profile_value_all(req.thread_data[i], req.data[i][key], g_target_pv_index) + "</td>";
                        else
                            html += "<td>0</td>";
                    }
                    html += "</tr>";
                }
                html += "</table></div>";
                $('#mainpanel').html(html);
                $("#charting_table").visualize({
                    type: "line",
                    width: 900,
                    height: 400,
                    parseDirection: "y",
                    colors: [
                        '#be1e2d','#666699','#92d5ea','#ee8310','#8d10ee','#5a3b16','#26a4ed','#f45a90','#e9e744',
                        '#FF1e2d','#FF6699','#92FFea','#ee83FF','#FF10ee','#5a3bFF','#26FFed','#f4FF90','#00FFFF'
                        
                    ]
                });
                $("#charting_table").hide();
            },
        });
    }
    else if(cmd[0] == "v" && cmd.length >= 2)
    {
        g_target_pv_index = parseInt(cmd[1]);
    }
}

function fetch_table_data(req)
{
    if(!req.initialized)
    {
        req.initialized = true;
        req.data = [];
        req.keys = {};
        req.keys_idx = [];
        req.thread_data = [];
        req.numkeys = 0;
        if(req.nodes)
        {
            req.node_map = {};
            for(var i = 0; i < req.nodes.length; i++)
            {
                req.node_map[req.nodes[i]] = true;
            }
        }
    }
    if(req.start_time >= req.end_time)
    {
        req.cb(req);
        return;
    }
    $.ajax({
        type: "POST",
        url: "/ds/tree/" + g_current_target + "/diff/" + req.start_time + "/" + (req.start_time + req.timewidth - 1),
        data: {},
        dataType: "json",
        success: function(data){
            if(!(data.threads[req.threadid]))
            {
                alert("No Node");
                return;
            }
            var thread = data.threads[req.threadid];
            
            var node_id_map = {};
            for(var i = 0; i < thread.nodes.length; i++)
            {
                node_id_map[ thread.nodes[i].id ] = thread.nodes[i];
            }
            
            nth_parent_id = function(node, n)
            {
                for(var i = 0; i < n; i++)
                {
                    if(!node)
                        return null;
                    node = node_id_map[node.pid];
                }
                if(!node)
                    return null;
                return node.id;
            }
            
            
            var current = {};
            for(var nodeid in thread.nodes)
            {
                var node = thread.nodes[nodeid];
                //if(nth_parent_id(node, req.depth) == req.nodeid)
                if(node.id in req.node_map)
                {
                    current[node.id] = node;
                    if(!(node.id in req.keys))
                    {
                        req.keys[node.id] = {
                            idx: req.numkeys,
                            id: node.id,
                            name: node.name,
                        };
                        req.keys_idx.push(req.keys[node.id]);
                        req.numkeys++;
                    }
                }
            }
            thread.nodes = null;
            req.data.push(current);
            req.thread_data.push(thread);
            req.start_time += req.timewidth;
            fetch_table_data(req);
        },
        error: function(){
            alert("Data Error");
        }
    });
}



function show_pending()
{
    $('#pendingpanel')
        .html("Loading...")
        .css("position", "absolute")
        .css("background-color", "black")
        .css("top", "0px")
        .css("left", "0px")
        .css("z-index", "10")
        .width($(window).width())
        .height($(window).height())
        .css("opacity", "0.5")
        .show();
}

function hide_pending()
{
    $('#pendingpanel').hide();
    
}


//////////////////////////////////////////////////////////////////////////
// Navigator
//////////////////////////////////////////////////////////////////////////


function update_nav()
{
    
    if('tree_reload' in Panels[g_active_panel])
        Panels[g_active_panel].tree_reload();
    else
        Panels[g_active_panel].init();


    var before_real_time = g_timenav.real_time;
    g_timenav.real_time = ($("#check_realtime").attr("checked") ? true : false);
    g_timenav.select_time = g_timenav_data.pos;
    g_timenav.select_width = g_timenav_data.width;
    $("#timebar_value").html(g_timenav.select_time);
    $("#timewidthbar_value").html(g_timenav.select_width);

    if(!before_real_time || !g_timenav.real_time)
    {
        g_clear_cct = true;
    }
    g_need_update_counter = 1;




}


g_timenav_data = {
    width: 10,
    pos: 0,
    max: 100,
    bar_size: 600,
    start_pagex: null,
    drag_mode: null,
    least_width: 18,
    button_width: 18,
};
function init_time_nav()
{
    var bar_sel = '#timebar';
    $(bar_sel).html("<div class='bar'><div class='bar_selector'><div class='btn_l'>&lt;</div><div class='label'>i</div><div class='btn_r'>&gt;</div></div></div>");
    
    g_timenav_data.px_per_val = (g_timenav_data.bar_size - g_timenav_data.least_width - g_timenav_data.button_width*2) / g_timenav_data.max;

    $(bar_sel + ' .bar')
        .css("height", "24px")
        .css("border", "1px solid #AAA")
    ;

    $('#modepanel')
            .mousemove(function(e){
            if(g_timenav_data.drag_mode != null)
            {
                e.preventDefault();
                var diff = (e.pageX - g_timenav_data.start_pagex) / g_timenav_data.px_per_val;
                if(g_timenav_data.drag_mode == "pos")
                {
                    g_timenav_data.pos = g_timenav_data.start_pos + diff;
                }
                else if(g_timenav_data.drag_mode == "left")
                {
                    g_timenav_data.width = g_timenav_data.start_width - diff;
                    g_timenav_data.pos = g_timenav_data.start_pos + diff;
                }
                else if(g_timenav_data.drag_mode == "right")
                {
                    g_timenav_data.width = g_timenav_data.start_width + diff;
                }
                update_time_nav({"controlled": true});
            }
        })
        .mouseup(function(e){
            g_timenav_data.drag_mode = null;
        })
        .mouseleave(function(e){
            g_timenav_data.drag_mode = null;
        })

    $(bar_sel + ' .bar_selector')
        .css("cursor", "move")
        .css("height", "24px")
        .css("background-color", "#DDDDFF")
        .css("font-size", "12px")
        .css("text-align", "center")
    ;

    $(bar_sel + ' .bar_selector .label')
        .mousedown(function(e){
            g_timenav_data.start_pagex = e.pageX;
            g_timenav_data.start_pos = g_timenav_data.pos;
            g_timenav_data.drag_mode = "pos";
            e.preventDefault();
        })
        .css("float", "left")
        .css("height", "24px")
    ;

    $(bar_sel + ' .btn_l').add(bar_sel + ' .btn_r')
        .css("height", "22px")
        .css("width", "" + (g_timenav_data.button_width) + "px")
        .css("background-color", "#DDDDFF")
        .css("border", "1px solid #000")
        .css("cursor")
    ;

    $(bar_sel + ' .btn_l')
        .css("float", "left")
        .css("cursor", "w-resize")
        .mousedown(function(e){
            g_timenav_data.start_pagex = e.pageX;
            g_timenav_data.drag_mode = "left";
            g_timenav_data.start_pos = g_timenav_data.pos;
            g_timenav_data.start_width = g_timenav_data.width;
            e.preventDefault();
        })
    ;
    $(bar_sel + ' .btn_r')
        .css("float", "right")
        .css("cursor", "e-resize")
        .mousedown(function(e){
            g_timenav_data.start_pagex = e.pageX;
            g_timenav_data.drag_mode = "right";
            g_timenav_data.start_pos = g_timenav_data.pos;
            g_timenav_data.start_width = g_timenav_data.width;
            e.preventDefault();
        })
    ;
    update_time_nav({});
}

function update_time_nav(data)
{
    var bar_sel = '#timebar';

    if(!data)
        data = {};
    for(var k in data)
    {
        g_timenav_data[k] = data[k];
    }
    
    if(g_timenav_data.pos > g_timenav_data.max - g_timenav_data.width)
        g_timenav_data.pos = g_timenav_data.max - g_timenav_data.width;
    if(g_timenav_data.pos < 0)
        g_timenav_data.pos = 0;

        
    var wmax = Math.min(40, g_timenav_data.max - g_timenav_data.pos);
    if(g_timenav_data.width > wmax)
        g_timenav_data.width = wmax;

    if(g_timenav_data.width < 1)
        g_timenav_data.width = 1;

    g_timenav_data.pos = Math.floor(g_timenav_data.pos);
    g_timenav_data.width = Math.floor(g_timenav_data.width);
    g_timenav_data.px_per_val = (g_timenav_data.bar_size - g_timenav_data.least_width - g_timenav_data.button_width*2) / g_timenav_data.max;
    var px_per_val = g_timenav_data.px_per_val;

    $(bar_sel + ' .bar')
        .css("width", ""+ g_timenav_data.bar_size +"px")
    ;
    $(bar_sel + ' .bar_selector')
        .css("width", "" + (g_timenav_data.width * px_per_val + g_timenav_data.least_width + g_timenav_data.button_width*2) + "px")
        .css("margin-left", "" + (g_timenav_data.pos * px_per_val) + "px")
    ;
    $(bar_sel + ' .bar_selector .label')
        .html("" + (g_timenav_data.width))
        .width((g_timenav_data.width * px_per_val + g_timenav_data.least_width - 8))
    ;

    if(data.controlled)
    {
        update_nav();
    }
}

$(function(){
    setTimeout(update_ui, 500);
    fit_panel();
    $(window).resize(fit_panel);

    $('#view_select').html("");
    g_active_panel = g_default_panel;
    for(var key in Panels)
    {
        var label = key;
        if('label' in Panels[key])
            label = Panels[key].label;
            
        var selected_html = (g_active_panel == key ? " selected='selected'" : "");
        $('#view_select').append(
            "<option value='" + key + "'"+ selected_html +">" + label + "</option>"
        );
    }
    $('#view_select').change(function(e){
        var panelname = $("#view_select").val();
        if(g_active_panel && Panels[g_active_panel])
            Panels[g_active_panel].hide();
        if(!panelname && !g_active_panel)
            g_active_panel = g_default_panel;
        else if(panelname)
            g_active_panel = panelname;
        Panels[g_active_panel].init();
        update_nav();
    });

    Panels[g_active_panel].init();
    
    
        
    init_time_nav();
    
    /*
    $('#timebar').slider({
        min: 0,
        max: 10,
        startValue: 0,
        slide: update_nav
    });
    $('#timewidthbar').slider({
        min: 1,
        max: 20,
        startValue: 1,
        slide: update_nav
    });
    */

    $("#view_select").change(update_nav);
    
    $('#check_realtime').click(update_nav);
    
    $('#command_do').click(function(){
        do_command($('#command_text').val());
    });
    
    $("#connect_button").click(function(){
        $.ajax({
            type: "POST",
            url: "/ds/new",
            data: {"host": $('#server_address').val()},
            dataType: "json",
            success: function(data){
            }
        });
    });
});
