
require("llprofpm")

function lua_tak(x, y, z)
    if x <= y then
        return y
    else
        return lua_tak(lua_tak(x-1,y,z),lua_tak(y-1,z,x),lua_tak(z-1,x,y))
    end
end

lua_tak(12,6,0)


