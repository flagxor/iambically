'use strict';


var CORE_WORDS = `
dup: js"var x = dstack.pop(); dstack.push(x); dstack.push(x);"
drop: js"dstack.pop();"
over: js"var x = dstack.pop(); var y = dstack.pop(); dstack.push(y); dstack.push(x); dstack.push(y);"
swap: js"var x = dstack.pop(); var y = dstack.pop(); dstack.push(x); dstack.push(y);"
.: "alerts" @ push
log: js"console.log(dstack.pop());"
+: js"var x = dstack.pop(); var y = dstack.pop(); dstack.push(y + x);"
*: js"var x = dstack.pop(); var y = dstack.pop(); dstack.push(y * x);"
repeat: js"var op = dstack.pop(); var n = dstack.pop(); var i = 0; var loop = function() { if (i >= n) { return; } i++; return op().then(loop); }; return Promise.resolve().then(loop);"
execute: js"return dstack.pop()();"
@: js"dstack.push(self.variables[dstack.pop()]);"
!: js"var x = dstack.pop(); var y = dstack.pop(); self.variables[x] = y;"
+!: swap over @ + swap !
split: js"var x = dstack.pop(); var y = dstack.pop(); dstack.push(x.split(y));"
join: js"var x = dstack.pop(); var y = dstack.pop(); dstack.push(x.join(y));"
length: js"dstack.push(dstack.pop().length);"
push: js"var x = dstack.pop(); var y = dstack.pop(); x.push(y);"
pop: js"dstack.push(dstack.pop().pop());"
shift: js"var x = dstack.pop(); var y = dstack.pop(); x.unshift(y);"
unshift: js"dstack.push(dstack.pop().shift());"
search: js"var x = dstack.pop(); var y = dstack.pop(); dstack.push(x.search(y));"
lower: js"dstack.push(dstack.pop().toLowerCase());"
upper: js"dstack.push(dstack.pop().toUpperCase());"
choose: "entry" @ "entries" @ push
toDate: js"dstack.push(new Date(dstack.pop()));"
create-stamp: toDate "created" ! drop
location-stamp: "longitude" ! "latitude" !
if: js"var x = dstack.pop(); var y = dstack.pop(); if (y) { return x(); }"
<: js"var x = dstack.pop(); var y = dstack.pop(); dstack.push(y < x);"
>=: js"var x = dstack.pop(); var y = dstack.pop(); dstack.push(y >= x);"
=: js"var x = dstack.pop(); var y = dstack.pop(); dstack.push(y == x);"
[x]: js"var x = dstack.pop(); var y = dstack.pop(); dstack.push(x[y]);"
`;
