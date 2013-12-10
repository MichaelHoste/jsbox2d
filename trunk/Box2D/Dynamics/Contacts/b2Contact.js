"use strict";

/// Friction mixing law. The idea is to allow either fixture to drive the restitution to zero.
/// For example, anything slides on ice.
function b2MixFriction(friction1, friction2)
{
	return b2Sqrt(friction1 * friction2);
}

/// Restitution mixing law. The idea is allow for anything to bounce off an inelastic surface.
/// For example, a superball bounces on anything.
function b2MixRestitution(restitution1, restitution2)
{
	return restitution1 > restitution2 ? restitution1 : restitution2;
}

function b2ContactRegister()
{
	this.createFcn = null;
	this.destroyFcn = null;
	this.primary = false;
};

/// A contact edge is used to connect bodies and contacts together
/// in a contact graph where each body is a node and each contact
/// is an edge. A contact edge belongs to a doubly linked list
/// maintained in each attached body. Each contact has two contact
/// nodes, one for each attached body.
function b2ContactEdge()
{
	this.other = null;			///< provides quick access to the other body attached.
	this.contact = null;		///< the contact
	this.prev = null;			///< the previous contact edge in the body's contact list
	this.next = null;			///< the next contact edge in the body's contact list
};

/// The class manages contact between two shapes. A contact exists for each overlapping
/// AABB in the broad-phase (except if filtered). Therefore a contact object may exist
/// that has no contact points.
function b2Contact(fA, indexA, fB, indexB)
{
	// Nodes for connecting bodies.
	this.m_nodeA = new b2ContactEdge();
	this.m_nodeB = new b2ContactEdge();

	this.m_manifold = new b2Manifold();

	this.m_toi = 0;

	this.m_flags = b2Contact.e_enabledFlag;

	this.m_fixtureA = fA || null;
	this.m_fixtureB = fB || null;

	this.m_indexA = indexA || 0;
	this.m_indexB = indexB || 0;

	this.m_manifold.pointCount = 0;

	this.m_prev = null;
	this.m_next = null;

	this.m_nodeA.contact = null;
	this.m_nodeA.prev = null;
	this.m_nodeA.next = null;
	this.m_nodeA.other = null;

	this.m_nodeB.contact = null;
	this.m_nodeB.prev = null;
	this.m_nodeB.next = null;
	this.m_nodeB.other = null;

	this.m_toiCount = 0;

	if (fA)
	{
		this.m_friction = b2MixFriction(this.m_fixtureA.m_friction, this.m_fixtureB.m_friction);
		this.m_restitution = b2MixRestitution(this.m_fixtureA.m_restitution, this.m_fixtureB.m_restitution);
	}
	else
	{
		this.m_friction = 0;
		this.m_restitution = 0;
	}

	this.m_tangentSpeed = 0.0;
}

b2Contact.prototype =
{
	/// Get the contact manifold. Do not modify the manifold unless you understand the
	/// internals of Box2D.
	GetManifold: function()
	{
		return this.m_manifold;
	},

	/// Get the world manifold.
	GetWorldManifold: function(worldManifold)
	{
		var bodyA = this.m_fixtureA.GetBody();
		var bodyB = this.m_fixtureB.GetBody();
		var shapeA = this.m_fixtureA.GetShape();
		var shapeB = this.m_fixtureB.GetShape();

		worldManifold.Initialize(this.m_manifold, bodyA.GetTransform(), shapeA.m_radius, bodyB.GetTransform(), shapeB.m_radius);
	},

	/// Is this contact touching?
	IsTouching: function()
	{
		return (this.m_flags & b2Contact.e_touchingFlag) == b2Contact.e_touchingFlag;
	},

	/// Enable/disable this contact. This can be used inside the pre-solve
	/// contact listener. The contact is only disabled for the current
	/// time step (or sub-step in continuous collisions).
	SetEnabled: function(flag)
	{
		if (flag)
		{
			this.m_flags |= b2Contact.e_enabledFlag;
		}
		else
		{
			this.m_flags &= ~b2Contact.e_enabledFlag;
		}
	},

	/// Has this contact been disabled?
	IsEnabled: function()
	{
		return (this.m_flags & b2Contact.e_enabledFlag) == b2Contact.e_enabledFlag;
	},

	/// Get the next contact in the world's contact list.
	GetNext: function()
	{
		return this.m_next;
	},

	/// Get fixture A in this contact.
	GetFixtureA: function()
	{
		return this.m_fixtureA;
	},

	/// Get the child primitive index for fixture A.
	GetChildIndexA: function()
	{
		return this.m_indexA;
	},

	/// Get fixture B in this contact.
	GetFixtureB: function()
	{
		return this.m_fixtureB;
	},

	/// Get the child primitive index for fixture B.
	GetChildIndexB: function()
	{
		return this.m_indexB;
	},

	/// Override the default friction mixture. You can call this in b2ContactListener::PreSolve.
	/// This value persists until set or reset.
	SetFriction: function(friction)
	{
		this.m_friction = friction;
	},

	/// Get the friction.
	GetFriction: function()
	{
		return this.m_friction;
	},

	/// Reset the friction mixture to the default value.
	ResetFriction: function()
	{
		this.m_friction = b2MixFriction(this.m_fixtureA.m_friction, this.m_fixtureB.m_friction);
	},

	/// Override the default restitution mixture. You can call this in b2ContactListener::PreSolve.
	/// The value persists until you set or reset.
	SetRestitution: function(restitution)
	{
		this.m_restitution = restitution;
	},

	/// Get the restitution.
	GetRestitution: function()
	{
		return this.m_restitution;
	},

	/// Reset the restitution to the default value.
	ResetRestitution: function()
	{
		this.m_restitution = b2MixRestitution(this.m_fixtureA.m_restitution, this.m_fixtureB.m_restitution);
	},

	/// Set the desired tangent speed for a conveyor belt behavior. In meters per second.
	SetTangentSpeed: function(speed)
	{
		this.m_tangentSpeed = speed;
	},

	/// Get the desired tangent speed. In meters per second.
	GetTangentSpeed: function()
	{
		return this.m_tangentSpeed;
	},

	/// Evaluate this contact with your own manifold and transforms.
	Evaluate: function(manifold, xfA, xfB) { },

	/// Flag this contact for filtering. Filtering will occur the next time step.
	FlagForFiltering: function()
	{
		this.m_flags |= b2Contact.e_filterFlag;
	},

	Update: function(listener)
	{
		var oldManifold = this.m_manifold.Clone();

		// Re-enable this contact.
		this.m_flags |= b2Contact.e_enabledFlag;

		var touching = false;
		var wasTouching = (this.m_flags & b2Contact.e_touchingFlag) == b2Contact.e_touchingFlag;

		var sensorA = this.m_fixtureA.IsSensor();
		var sensorB = this.m_fixtureB.IsSensor();
		var sensor = sensorA || sensorB;

		var bodyA = this.m_fixtureA.GetBody();
		var bodyB = this.m_fixtureB.GetBody();
		var xfA = bodyA.GetTransform();
		var xfB = bodyB.GetTransform();

		// Is this contact a sensor?
		if (sensor)
		{
			var shapeA = this.m_fixtureA.GetShape();
			var shapeB = this.m_fixtureB.GetShape();
			touching = b2TestShapeOverlap(shapeA, this.m_indexA, shapeB, this.m_indexB, xfA, xfB);

			// Sensors don't generate manifolds.
			this.m_manifold.pointCount = 0;
		}
		else
		{
			this.Evaluate(this.m_manifold, xfA, xfB);
			touching = this.m_manifold.pointCount > 0;

			// Match old contact ids to new contact ids and copy the
			// stored impulses to warm start the solver.
			for (var i = 0; i < this.m_manifold.pointCount; ++i)
			{
				var mp2 = this.m_manifold.points[i];
				mp2.normalImpulse = 0.0;
				mp2.tangentImpulse = 0.0;
				var id2 = mp2.id;

				for (var j = 0; j < oldManifold.pointCount; ++j)
				{
					var mp1 = oldManifold.points[j];

					if (mp1.id.GetKey() == id2.GetKey())
					{
						mp2.normalImpulse = mp1.normalImpulse;
						mp2.tangentImpulse = mp1.tangentImpulse;
						break;
					}
				}
			}

			if (touching != wasTouching)
			{
				bodyA.SetAwake(true);
				bodyB.SetAwake(true);
			}
		}

		if (touching)
		{
			this.m_flags |= b2Contact.e_touchingFlag;
		}
		else
		{
			this.m_flags &= ~b2Contact.e_touchingFlag;
		}

		if (wasTouching == false && touching == true && listener)
		{
			listener.BeginContact(this);
		}

		if (wasTouching == true && touching == false && listener)
		{
			listener.EndContact(this);
		}

		if (sensor == false && touching && listener)
		{
			listener.PreSolve(this, oldManifold);
		}
	}
};

// Used when crawling contact graph when forming islands.
b2Contact.e_islandFlag = 0x0001;

// Set when the shapes are touching.
b2Contact.e_touchingFlag = 0x0002;

// This contact can be disabled (by user)
b2Contact.e_enabledFlag = 0x0004;

// This contact needs filtering because a fixture filter was changed.
b2Contact.e_filterFlag = 0x0008;

// This bullet contact had a TOI event
b2Contact.e_bulletHitFlag = 0x0010;

// This contact has a valid TOI in this->m_toi
b2Contact.e_toiFlag = 0x0020;

function b2CircleContact(fixtureA, fixtureB)
{
	this.parent.call(this, fixtureA, 0, fixtureB, 0);
	b2Assert(this.m_fixtureA.GetType() == b2Shape.e_circle);
	b2Assert(this.m_fixtureB.GetType() == b2Shape.e_circle);
}

b2CircleContact.prototype =
{
	Evaluate: function(manifold, xfA, xfB)
	{
		b2CollideCircles(manifold,
						this.m_fixtureA.GetShape(), xfA,
						this.m_fixtureB.GetShape(), xfB);
	}
};

b2CircleContact.Create = function(fixtureA, unused1, fixtureB, unused2)
{
	return new b2CircleContact(fixtureA, fixtureB);
};

b2CircleContact.Destroy = function(contact)
{
};

b2CircleContact._extend(b2Contact);


function b2PolygonContact(fixtureA, fixtureB)
{
	this.parent.call(this, fixtureA, 0, fixtureB, 0);
	b2Assert(this.m_fixtureA.GetType() == b2Shape.e_polygon);
	b2Assert(this.m_fixtureB.GetType() == b2Shape.e_polygon);
}

b2PolygonContact.prototype =
{
	Evaluate: function(manifold, xfA, xfB)
	{
		b2CollidePolygons(manifold,
						this.m_fixtureA.GetShape(), xfA,
						this.m_fixtureB.GetShape(), xfB);
	}
};

b2PolygonContact.Create = function(fixtureA, unused1, fixtureB, unused2)
{
	return new b2PolygonContact(fixtureA, fixtureB);
};

b2PolygonContact.Destroy = function(contact)
{
};

b2PolygonContact._extend(b2Contact);


function b2ChainAndCircleContact(fixtureA, indexA, fixtureB, indexB)
{
	this.parent.call(this, fixtureA, indexA, fixtureB, indexB);
	b2Assert(this.m_fixtureA.GetType() == b2Shape.e_chain);
	b2Assert(this.m_fixtureB.GetType() == b2Shape.e_circle);
}

b2ChainAndCircleContact.prototype =
{
	Evaluate: function(manifold, xfA, xfB)
	{
		var chain = this.m_fixtureA.GetShape();
		var edge = new b2EdgeShape();
		chain.GetChildEdge(edge, this.m_indexA);
		b2CollideEdgeAndCircle(	manifold, edge, xfA,
								this.m_fixtureB.GetShape(), xfB);
	}
};

b2ChainAndCircleContact.Create = function(fixtureA, indexA, fixtureB, indexB)
{
	return new b2ChainAndCircleContact(fixtureA, indexA, fixtureB, indexB);
};

b2ChainAndCircleContact.Destroy = function(contact)
{
};

b2ChainAndCircleContact._extend(b2Contact);


function b2ChainAndPolygonContact(fixtureA, indexA, fixtureB, indexB)
{
	this.parent.call(this, fixtureA, indexA, fixtureB, indexB);
	b2Assert(this.m_fixtureA.GetType() == b2Shape.e_chain);
	b2Assert(this.m_fixtureB.GetType() == b2Shape.e_polygon);
}

b2ChainAndPolygonContact.prototype =
{
	Evaluate: function(manifold, xfA, xfB)
	{
		var chain = this.m_fixtureA.GetShape();
		var edge = new b2EdgeShape();
		chain.GetChildEdge(edge, this.m_indexA);
		b2CollideEdgeAndPolygon(	manifold, edge, xfA,
									this.m_fixtureB.GetShape(), xfB);
	}
};

b2ChainAndPolygonContact.Create = function(fixtureA, indexA, fixtureB, indexB)
{
	return new b2ChainAndPolygonContact(fixtureA, indexA, fixtureB, indexB);
};

b2ChainAndPolygonContact.Destroy = function(contact)
{
};

b2ChainAndPolygonContact._extend(b2Contact);


function b2EdgeAndCircleContact(fixtureA, fixtureB)
{
	this.parent.call(this, fixtureA, 0, fixtureB, 0);
	b2Assert(this.m_fixtureA.GetType() == b2Shape.e_edge);
	b2Assert(this.m_fixtureB.GetType() == b2Shape.e_circle);
}

b2EdgeAndCircleContact.prototype =
{
	Evaluate: function(manifold, xfA, xfB)
	{
		b2CollideEdgeAndCircle(	manifold,
								this.m_fixtureA.GetShape(), xfA,
								this.m_fixtureB.GetShape(), xfB);
	}
};

b2EdgeAndCircleContact.Create = function(fixtureA, indexA, fixtureB, indexB)
{
	return new b2EdgeAndCircleContact(fixtureA, fixtureB);
};

b2EdgeAndCircleContact.Destroy = function(contact)
{
};

b2EdgeAndCircleContact._extend(b2Contact);


function b2EdgeAndPolygonContact(fixtureA, fixtureB)
{
	this.parent.call(this, fixtureA, 0, fixtureB, 0);
	b2Assert(this.m_fixtureA.GetType() == b2Shape.e_edge);
	b2Assert(this.m_fixtureB.GetType() == b2Shape.e_polygon);
}

b2EdgeAndPolygonContact.prototype =
{
	Evaluate: function(manifold, xfA, xfB)
	{
		b2CollideEdgeAndPolygon(	manifold,
									this.m_fixtureA.GetShape(), xfA,
									this.m_fixtureB.GetShape(), xfB);
	}
};

b2EdgeAndPolygonContact.Create = function(fixtureA, indexA, fixtureB, indexB)
{
	return new b2EdgeAndPolygonContact(fixtureA, fixtureB);
};

b2EdgeAndPolygonContact.Destroy = function(contact)
{
};

b2EdgeAndPolygonContact._extend(b2Contact);


function b2PolygonAndCircleContact(fixtureA, fixtureB)
{
	this.parent.call(this, fixtureA, 0, fixtureB, 0);
	b2Assert(this.m_fixtureA.GetType() == b2Shape.e_polygon);
	b2Assert(this.m_fixtureB.GetType() == b2Shape.e_circle);
}

b2PolygonAndCircleContact.prototype =
{
	Evaluate: function(manifold, xfA, xfB)
	{
		b2CollidePolygonAndCircle(	manifold,
									this.m_fixtureA.GetShape(), xfA,
									this.m_fixtureB.GetShape(), xfB);
	}
};

b2PolygonAndCircleContact.Create = function(fixtureA, indexA, fixtureB, indexB)
{
	return new b2PolygonAndCircleContact(fixtureA, fixtureB);
};

b2PolygonAndCircleContact.Destroy = function(contact)
{
};

b2PolygonAndCircleContact._extend(b2Contact);



function b2PolygonContact(fixtureA, fixtureB)
{
	this.parent.call(this, fixtureA, 0, fixtureB, 0);
	b2Assert(this.m_fixtureA.GetType() == b2Shape.e_polygon);
	b2Assert(this.m_fixtureB.GetType() == b2Shape.e_polygon);
}

b2PolygonContact.prototype =
{
	Evaluate: function(manifold, xfA, xfB)
	{
		b2CollidePolygons(	manifold,
							this.m_fixtureA.GetShape(), xfA,
							this.m_fixtureB.GetShape(), xfB);
	}
};

b2PolygonContact.Create = function(fixtureA, indexA, fixtureB, indexB)
{
	return new b2PolygonContact(fixtureA, fixtureB);
};

b2PolygonContact.Destroy = function(contact)
{
};

b2PolygonContact._extend(b2Contact);


b2Contact.AddType = function(createFcn, destoryFcn,
						type1, type2)
{
	b2Assert(0 <= type1 && type1 < b2Shape.e_typeCount);
	b2Assert(0 <= type2 && type2 < b2Shape.e_typeCount);

	if (!b2Contact.s_registers[type1])
		b2Contact.s_registers[type1] = [];

	b2Contact.s_registers[type1][type2] = new b2ContactRegister();
	b2Contact.s_registers[type1][type2].createFcn = createFcn;
	b2Contact.s_registers[type1][type2].destroyFcn = destoryFcn;
	b2Contact.s_registers[type1][type2].primary = true;

	if (type1 != type2)
	{
		if (!b2Contact.s_registers[type2])
			b2Contact.s_registers[type2] = [];

		b2Contact.s_registers[type2][type1] = new b2ContactRegister();
		b2Contact.s_registers[type2][type1].createFcn = createFcn;
		b2Contact.s_registers[type2][type1].destroyFcn = destoryFcn;
		b2Contact.s_registers[type2][type1].primary = false;
	}
};

b2Contact.InitializeRegisters = function()
{
	b2Contact.AddType(b2CircleContact.Create, b2CircleContact.Destroy, b2Shape.e_circle, b2Shape.e_circle);
	b2Contact.AddType(b2PolygonAndCircleContact.Create, b2PolygonAndCircleContact.Destroy, b2Shape.e_polygon, b2Shape.e_circle);
	b2Contact.AddType(b2PolygonContact.Create, b2PolygonContact.Destroy, b2Shape.e_polygon, b2Shape.e_polygon);
	b2Contact.AddType(b2EdgeAndCircleContact.Create, b2EdgeAndCircleContact.Destroy, b2Shape.e_edge, b2Shape.e_circle);
	b2Contact.AddType(b2EdgeAndPolygonContact.Create, b2EdgeAndPolygonContact.Destroy, b2Shape.e_edge, b2Shape.e_polygon);
	b2Contact.AddType(b2ChainAndCircleContact.Create, b2ChainAndCircleContact.Destroy, b2Shape.e_chain, b2Shape.e_circle);
	b2Contact.AddType(b2ChainAndPolygonContact.Create, b2ChainAndPolygonContact.Destroy, b2Shape.e_chain, b2Shape.e_polygon);
};

b2Contact.Create = function(fixtureA, indexA, fixtureB, indexB)
{
	if (b2Contact.s_initialized == false)
	{
		b2Contact.InitializeRegisters();
		b2Contact.s_initialized = true;
	}

	var type1 = fixtureA.GetType();
	var type2 = fixtureB.GetType();

	b2Assert(0 <= type1 && type1 < b2Shape.e_typeCount);
	b2Assert(0 <= type2 && type2 < b2Shape.e_typeCount);

	var createFcn = b2Contact.s_registers[type1][type2].createFcn;
	if (createFcn)
	{
		if (b2Contact.s_registers[type1][type2].primary)
		{
			return createFcn(fixtureA, indexA, fixtureB, indexB);
		}
		else
		{
			return createFcn(fixtureB, indexB, fixtureA, indexA);
		}
	}
	else
	{
		return null;
	}
};

b2Contact.Destroy = function(contact)
{
	b2Assert(b2Contact.s_initialized == true);

	var fixtureA = contact.m_fixtureA;
	var fixtureB = contact.m_fixtureB;

	if (contact.m_manifold.pointCount > 0 &&
		fixtureA.IsSensor() == false &&
		fixtureB.IsSensor() == false)
	{
		fixtureA.GetBody().SetAwake(true);
		fixtureB.GetBody().SetAwake(true);
	}

	var typeA = fixtureA.GetType();
	var typeB = fixtureB.GetType();

	b2Assert(0 <= typeA && typeB < b2Shape.e_typeCount);
	b2Assert(0 <= typeA && typeB < b2Shape.e_typeCount);

	var destroyFcn = b2Contact.s_registers[typeA][typeB].destroyFcn;
	destroyFcn(contact);
};

b2Contact.s_registers = [];
b2Contact.s_initialized = false;