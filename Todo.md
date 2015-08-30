# Tests #

I plan to create & port more tests to JSBox2D. I will scour the web for other language tests and make versions of them for this.

# ECMAScript 6 #

When ES6 is widespread, an ES6 version will be available as well. It will likely be alongside the ES5 version, but I am not positive yet.

# JSON #

JS is one of the best languages for use of JSON - as such, I will be implementing a JSON serializer of Box2D worlds in here. I will also be submitting the code (maybe only the read part) for use in the C++ version as a contribution.

# Dump #

At the moment, the Dump feature from C++ is not supported. This feature may return in the future (with both JS and C++ dialects available for dumping).

# Optimization #

Of course, with ports like this, optimization is something that will be easier to do with a stable release. Once I am confident that everything base is finished and working perfectly, optimization will begin. This includes things like making sure there are no unneeded clones, as well as finding ways of reducing garbage collection.