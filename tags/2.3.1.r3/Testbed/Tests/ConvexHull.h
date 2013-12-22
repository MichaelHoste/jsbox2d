/*
* Copyright (c) 2011 Erin Catto http://www.box2d.org
*
* This software is provided 'as-is', without any express or implied
* warranty.  In no event will the authors be held liable for any damages
* arising from the use of this software.
* Permission is granted to anyone to use this software for any purpose,
* including commercial applications, and to alter it and redistribute it
* freely, subject to the following restrictions:
* 1. The origin of this software must not be misrepresented; you must not
* claim that you wrote the original software. If you use this software
* in a product, an acknowledgment in the product documentation would be
* appreciated but is not required.
* 2. Altered source versions must be plainly marked as such, and must not be
* misrepresented as being the original software.
* 3. This notice may not be removed or altered from any source distribution.
*/

#ifndef CONVEX_HULL_H
#define CONVEX_HULL_H

class ConvexHull : public Test
{
public:
	enum
	{
		e_count = b2_maxPolygonVertices
	};

	ConvexHull()
	{
		Generate();
		this->m_auto = false;
	}

	void Generate()
	{
		b2Vec2 lowerBound(-8.0, -8.0);
		b2Vec2 upperBound(8.0, 8.0);

		for (int32 i = 0; i < e_count; ++i)
		{
			float32 x = 10.0 * RandomFloat();
			float32 y = 10.0 * RandomFloat();

			// Clamp onto a square to help create collinearities.
			// This will stress the convex hull algorithm.
			b2Vec2 v(x, y);
			v.Assign(b2Clamp_v2(v, lowerBound, upperBound));
			this->m_points[i].Assign(v);
		}

		this->m_count = e_count;
	}

	static Test* Create()
	{
		return new ConvexHull;
	}

	void Keyboard(int key)
	{
		switch (key)
		{
		case GLFW_KEY_A:
			this->m_auto = !this->m_auto;
			break;

		case GLFW_KEY_G:
			Generate();
			break;
		}
	}

	void Step(Settings* settings)
	{
		Test::Step(settings);

		b2PolygonShape shape;
		shape.Set(this->m_points, this->m_count);

		g_debugDraw.DrawString(5, this->m_textLine, "Press g to generate a new random convex hull");
		this->m_textLine += DRAW_STRING_NEW_LINE;

		g_debugDraw.DrawPolygon(shape.m_vertices, shape.m_count, b2Color(0.9, 0.9, 0.9));

		for (int32 i = 0; i < this->m_count; ++i)
		{
			g_debugDraw.DrawPoint(this->m_points[i], 2.0, b2Color(0.9, 0.5, 0.5));
			g_debugDraw.DrawString(b2Vec2::Add(this->m_points[i], b2Vec2(0.05f, 0.05f)), "%d", i);
		}

		if (shape.Validate() == false)
		{
			this->m_textLine += 0;
		}

		if (this->m_auto)
		{
			Generate();
		}
	}

	b2Vec2 m_points[b2_maxPolygonVertices];
	int32 m_count;
	bool m_auto;
};

#endif
