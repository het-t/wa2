var a = 3;
(()=>{
    a++;
})()

var p = ()=>{
    a = a+1;
    console.log(a)
}
p();