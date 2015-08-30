# Internal #

The changed internal aspects are not as important, but basically they consist of most of the changes below as well as some minor changes that probably won't affect your code.

# References #

JS objects are purely reference-based, and as such simple "as-value" representations are not possible - sadly this has some consequences depending on the code and how the code is used.

A good example is b2Body::GetPosition - it returns, in C++, a const reference to the transform position, which is often copied to a variable at run-time using the copy constructor. In JS, it returns a **reference** to the position. This means that:

```
b2Vec2 p = body->GetPosition();
p.x = 50;
```

is NOT the same as

```
var p = body.GetPosition();
p.x = 50;
```

**References returned by these functions, for speed purposes, are not cloned for you!** You must take care to clone these references yourself. Most math-related types have two new members that you can use for these purposes - Assign and Clone. Assign is the replacement for the = operator. Clone is the cloning facility. The proper way to use the code above would be:

```
var p = body.GetPosition().Clone();
p.x = 50;
```

That would ensure that it doesn't get messed up.

# Name Changes #

A few functions (mostly overloads) have had their names changed. A list of them are below.

  * bool **b2TestOverlap**(b2Shape`*`, indexA, b2Shape`*`, indexB, b2Transform&, b2Transform&) -> function **b2TestShapeOverlap**(shapeA, indexA, shapeB, indexB, xfA, xfB)
  * void **b2Distance**(b2DistanceOutput`*`, b2SimplexCache`*`, b2DistanceInput`*`) -> function **b2DistanceFunc**(output, cache, input)

Any function that used to have overloads (such as b2Mul, b2Dot, etc) have been changed to functions that include the type parameters in the names. For instance, **b2Dot**(b2Vec2, b2Vec2) is now **b2Dot\_v2\_v2**; **b2Mul**(b2Transform, b2Vec2) is now **b2Mul\_t\_v2**. A full list may be available at some point. The type IDs are fairly easy to work out:
  * f = Number
  * v2 = b2Vec2
  * v3 = b2Vec3
  * m22 = b2Mat22
  * m33 = b2Mat33
  * t = b2Transform
  * r = b2Rot

# Enums #

Any global enums were moved to functions that pertained to the enumeration. For instance, b2\_dynamic/b2\_static/b2\_kinematic now must be accessed via b2Body (b2Body.b2\_dynamic, etc). For the most part it should be self-explanatory where the enums were moved to. This may change in the future.