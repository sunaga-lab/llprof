<?php





function tak($x,$y,$z){
    if($x <= $y){
        return $y;
    }
    else
    {
        return tak(tak($x-1,$y,$z),tak($y-1,$z,$x),tak($z-1,$x,$y));
    }
}


function a()
{
    tak(12,6,0);
}

a();
b();

?>
