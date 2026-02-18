const pairs=[{num: 'amountnum',range:'amountrange'},
    {num: 'interestnum',range:'interestrange'},
    {num: 'tenurenum',range:'tenurerange'}
];
pairs.forEach(pair=>{
    const num=document.getElementById(pair.num);
    const range=document.getElementById(pair.range);
    num.addEventListener("input",()=>{
        range.value=num.value;
    });
    range.addEventListener("input",()=>{
        num.value=range.value;
    });
});
function doit(){
    
}