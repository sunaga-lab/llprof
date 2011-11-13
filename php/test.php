<?php

function php_tak($x,$y,$z){
    if($x <= $y){
        return $y;
    }
    else
    {
        return php_tak(php_tak($x-1,$y,$z),php_tak($y-1,$z,$x),php_tak($z-1,$x,$y));
    }
}


function a()
{
    php_tak(12,6,0);
}

a();

?>
