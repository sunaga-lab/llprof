

function get_data()
{
    var result = [];
    var len = 5;
    var sum = 0.0;
    for(var i = 0; i < len; i++)
    {
        result[i] = Math.random();
        sum += result[i];
    }
    for(var i = 0; i < len; i++)
    {
        result[i] = result[i] / sum;
    }
    sum = 0.0;
    for(var i = 0; i < len; i++)
    {
        sum += result[i];
    }
    return result;
}

MAX_DEPTH = 4;
id_seq = 0;
nBox = 0;
gObjTree = {};

function draw_box(elem, depth, x,y,w,h)
{
    if(depth > MAX_DEPTH)
        return {};
    id_seq++;
    $("#cvs").append("<div id='box_"+id_seq+"' class='box'></div>");
    nBox += 1;
    var box = $("#box_" + id_seq);
    x += 2;
    y += 2;
    w -= 4;
    h -= 4;
    box.width(w).height(h).css("left", x).css("top", y);
    box.css("background-color", "red");
    
    var data = get_data();
    var sumval = 0.0;
    var treenode = {}
    for(var i = 0; i < data.length; i++)
    {
        var v = data[i];
        treenodeleaf = {};
        if(depth % 2 == 0)
        {
            v = v*h;
            treenodeleaf = draw_box(box, depth+1, x, y+sumval, w, v);
            sumval += v;
        }
        else
        {
            v = v*w;
            treenodeleaf = draw_box(box, depth+1, x+sumval, y, v, h);
            sumval += v;
        }
        treenode[i] = {"value": v, "name": "sss" + v, "children": treenodeleaf};
    }
    return treenode;
}

MAX_MAX_DEPTH = 4;

function profile(depth)
{
    if(depth > MAX_MAX_DEPTH)
        return;
    MAX_DEPTH = depth;
    nBox = 0;
    var startTime = new Date();
    gObjTree = draw_box($("#cvs"), 0, 0, 0, 798,798);
    var endTime = new Date();
    alert("D=" + depth + " Time: " + (endTime - startTime) + "ms  nBox:" + nBox);
    setTimeout(function(){profile(depth+1);}, 1000);
}

function tbl_profile()
{
    $("#cvs").html("<table id='t'></table>");
    tbl_profile_next();
}

gArray = {};
function tbl_profile_next()
{
    var startTime = new Date();
    var r = Math.random();
    var added = 0;
    for(var i = 0; i < 1000; i++)
    {
 
        var id = "table_item_" + i;
        var elem = $("#"+id);
        if(elem.length == 0)
        {
            $("#t").append("<tr id='"+id+"'><td class='col_i'>"+i+"</td><td class='col_id'>"+id+"</td><td class='col_r'> 5q5w4fq6gwqeg gwewrh4 </td></tr>");
            added++;
            elem = $("#"+id);
        }
        gArray[id] = "" + r;
        //elem.children("tr .col_r").html("" + r);
    }
    var endTime = new Date();
    alert(" Time: " + (endTime - startTime) + "ms added:" + added);
    setTimeout(tbl_profile_next, 4000);
}

$(function(){
    $("#cvs")
        .width(800).height(800);
    tbl_profile(1);
});
