Download the [latest release](https://code.google.com/p/jsbox2d/) and script tag it in your HTML. Once you have it included, you have two options;

If you wish to use the new non-cluttering object namespace (since `r3`) you can start using JSBox2D. All of the objects & functions will be added to the "b2" object. On node.js, the returned module will have the functions.

```
<script src="jsbox2d.min.js" type="script/javascript"></script>
<script>
var world = new b2.World(new b2.Vec2(0, -10));
</script>
```

Optionally, you can also enable compatibility mode, which will return your code to pre-`r2` state as well as be more similar to the C++ version.

```
<script>
var b2_compatibility = true;
</script>
<script src="jsbox2d.min.js" type="script/javascript"></script>
<script>
var world = new b2World(new b2Vec2(0, -10));
</script>
```

I'd recommend that you view the samples in the [TestBed](https://code.google.com/p/jsbox2d/source/browse/#svn%2Ftrunk) (all Test----.js files) to see how to use specific features. I'd also recommend you check out [Box2D's documentation](http://box2d.org/documentation.html) as it is the exact same codebase.