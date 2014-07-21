window._requestAF = (function() {
  return window.requestAnimationFrame ||
	 window.webkitRequestAnimationFrame ||
	 window.mozRequestAnimationFrame ||
	 window.oRequestAnimationFrame ||
	 window.msRequestAnimationFrame ||
	 function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
	   window.setTimeout(callback, 1000/60);
	 };
})();


	//package net.ivank.geom;

	/**
	 * A class for representing a 2D point
	 * @author Ivan Kuckir
	 */

	/**
	 * @constructor
	 */
	function Point(x, y)
	{
		if(!x) x=0; if(!y) y=0;
		this.x = x;
		this.y = y;
	}

	Point.prototype.add   = function(p)
	{
		return new Point(this.x+p.x, this.y+p.y);
	}

	Point.prototype.clone = function()
	{
		return new Point(this.x, this.y);
	}

	Point.prototype.copyFrom = function(p)
	{
		this.x = p.x; this.y = p.y;
	}

	Point.prototype.equals = function(p)
	{
		return (this.x == p.x && this.y == p.y);
	}

	Point.prototype.normalize = function(len)
	{
		var l = Math.sqrt(this.x*this.x + this.y*this.y)
		this.x *= len/l;
		this.y *= len/l;
	}

	Point.prototype.offset = function(x,y)
	{
		this.x += x;  this.y += y;
	}

	Point.prototype.setTo = function(xa, ya)
	{
		this.x = xa; this.y = ya;
	}

	Point.prototype.subtract = function(p)
	{
		return new Point(this.x-p.x, this.y-p.y);
	}


	Point.distance = function(a, b)
	{
		return Point._distance(a.x, a.y, b.x, b.y);
	}

	Point.interpolate = function(a, b, f)
	{
		return new Point(a.x + f*(b.x-a.x), a.y + f*(b.y-a.y));
	}

	Point.polar = function(len, ang)
	{
		return new Point(len * Math.cos(ang), len * Math.sin(ang));
	}

	Point._distance = function(x1, y1, x2, y2)
	{
		return Math.sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1) );
	}

Point._v4 = {};
Point._m4 = {};

Point._v4.create = function() {
    var out = new Float32Array(4);
    return out;
};

Point._m4.create = function (mat) {
	var d = new Float32Array(16);
	d[0] = d[5] = d[10] = d[15] = 1.0;
	if (mat) Point._m4.set(mat, d);
	return d;
};


Point._v4.add = function(a, b, out) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
};

Point._v4.set = function(a, out) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
};

Point._m4.set = function (m, d) {
	d[0 ] = m[0 ];	d[1 ] = m[1 ];  d[2 ] = m[2 ];	d[3 ] = m[3 ];
	d[4 ] = m[4 ];	d[5 ] = m[5 ];  d[6 ] = m[6 ];	d[7 ] = m[7 ];
	d[8 ] = m[8 ];	d[9 ] = m[9 ];  d[10] = m[10];  d[11] = m[11];
	d[12] = m[12];  d[13] = m[13];  d[14] = m[14];  d[15] = m[15];
};

Point._m4.multiply = function (a, b, out) {

	var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
};

Point._m4.inverse = function(a, out) {
     var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
        return null;
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
};

Point._m4.multiplyVec2 = function(m, vec, dest) {
    var x = vec[0], y = vec[1];
    dest[0] = x * m[0] + y * m[4] + m[12];
    dest[1] = x * m[1] + y * m[5] + m[13];
}

Point._m4.multiplyVec4 = function(m, v, out) {
	var v0 = v[0], v1 = v[1], v2 = v[2], v3 = v[3];

	out[0] = m[0]*v0 + m[4]*v1 + m[8 ]*v2 + m[12]*v3;
	out[1] = m[1]*v0 + m[5]*v1 + m[9 ]*v2 + m[13]*v3;
	out[2] = m[2]*v0 + m[6]*v1 + m[10]*v2 + m[14]*v3;
	out[3] = m[3]*v0 + m[7]*v1 + m[11]*v2 + m[15]*v3;
}
	//package net.ivank.geom;

	/**
	 * A basic class for representing an axis-aligned rectangle
	 * @author Ivan Kuckir
	 *
	 */

	/**
	 * @constructor
	 */
	function Rectangle(x, y, w, h)
	{
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;
	}

	Rectangle.prototype.clone = function()
	{
		return new Rectangle(this.x, this.y, this.width, this.height);
	}

	Rectangle.prototype.contains = function(x, y)
	{
		return (x >= this.x && x <= this.x+this.width) && (y >= this.y && y <= this.y+this.height);
	}

	Rectangle.prototype.containsPoint = function(p)
	{
		return this.contains(p.x, p.y);
	}

	Rectangle.prototype.containsRect = function(r)
	{
		return (this.x<=r.x && this.y<=r.y && r.x+r.width<=this.x+this.width && r.y+r.height<=this.y+this.height);
	}

	Rectangle.prototype.copyFrom = function(r)
	{
		this.x = r.x; this.y = r.y; this.width = r.width; this.height = r.height;
	}

	Rectangle.prototype.equals = function(r)
	{
		return(this.x==r.x && this.y==r.y && this.width==r.width && this.height == r.height);
	}

	Rectangle.prototype.inflate = function(dx, dy)
	{
		this.x -= dx;
		this.y -= dy;
		this.width  += 2*dx;
		this.height += 2*dy;
	}

	Rectangle.prototype.inflatePoint = function(p)
	{
		this.inflate(p.x, p.y);
	}

	Rectangle.prototype.intersection = function(rec)	// : Boolean
	{
		var l = Math.max(this.x, rec.x);
		var u = Math.max(this.y, rec.y);
		var r = Math.min(this.x+this.width , rec.x+rec.width );
		var d = Math.min(this.y+this.height, rec.y+rec.height);
		return new Rectangle(l, u, r-l, d-u);
	}

	Rectangle.prototype.intersects = function(r)	// : Boolean
	{
		if(r.y+r.height<this.y || r.x>this.x+this.width || r.y>this.y+this.height || r.x+r.width<this.x) return false;
		return true;
	}

	Rectangle.prototype.isEmpty = function()	// : Boolean
	{
		return (this.width<=0 || this.height <= 0);
	}

	Rectangle.prototype.offset = function(dx, dy)	// : Boolean
	{
		this.x += dx; this.y += dy;
	}

	Rectangle.prototype.offsetPoint = function(p)	// : Boolean
	{
		this.offset(p.x, p.y)
	}

	Rectangle.prototype.setEmpty = function()	// : Boolean
	{
		this.x = this.y = this.width = this.height = 0;
	}

	Rectangle.prototype.setTo = function(r)	// : Boolean
	{
		this.x = r.x; this.y = r.y; this.width = r.width; this.height = r.height;
	}

	Rectangle.prototype.union = function(r)	// : Rectangle
	{
		var nr = this.clone();
		nr._unionWith(r);
		return nr;
	}


	Rectangle._temp = new Float32Array(2);

	Rectangle.prototype._unionWith = function(r) // : void
	{
		this._unionWP(r.x, r.y);
		this._unionWP(r.x+r.width, r.y+r.height);
	}

	Rectangle.prototype._unionWP = function(x, y)	// union with point
	{
		var minx = Math.min(this.x, x);
		var miny = Math.min(this.y, y);
		this.width  = Math.max(this.x + this.width , x) - minx;
		this.height = Math.max(this.y + this.height, y) - miny;
		this.x = minx; this.y = miny;
	}

	Rectangle.prototype._setP = function(x, y)
	{
		this.x = x; this.y = y;
		this.width = this.height = 0;
	}

	Rectangle.prototype._setAndTransform = function(r, m)
	{
		var t = Rectangle._temp;
		var mv2 = Point._m4.multiplyVec2;
		t[0] = r.x; t[1] = r.y;
		mv2(m, t, t);
		this._setP(t[0], t[1]);

		t[0] = r.x+r.width; t[1] = r.y;
		mv2(m, t, t);
		this._unionWP(t[0], t[1]);

		t[0] = r.x; t[1] = r.y+r.height;
		mv2(m, t, t);
		this._unionWP(t[0], t[1]);

		t[0] = r.x+r.width; t[1] = r.y+r.height;
		mv2(m, t, t);
		this._unionWP(t[0], t[1]);
	}
	//package net.ivank.geom;

	/**
	 * A class for representing a 2D point
	 * @author Ivan Kuckir
	 */
	function Transform()
	{
		this._obj		= null;

		this._mdirty		= false;		// matrix dirty
		this._vdirty		= false;		// values dirty

		this._tmat		= Point._m4.create();
		this._imat		= Point._m4.create();
		this._atmat		= Point._m4.create();
		this._aimat		= Point._m4.create();

		this._cmat		= Point._m4.create();
		this._cvec		= Point._v4.create();
		this._cID		= true;

		this._scaleX		= 1;
		this._scaleY		= 1;
		this._scaleZ		= 1;
		this._rotationX		= 0;
		this._rotationY		= 0;
		this._rotationZ		= 0;
	}

	Transform.prototype._getTMat = function()
	{
		var o = this._obj;
		var m = this._tmat;
		this._checkMat();
		m[12] = o.x;  m[13] = o.y;  m[14] = o.z;
		return m;
	}

	Transform.prototype._getIMat = function()
	{
		Point._m4.inverse(this._getTMat(), this._imat);
		return this._imat;
	}

	Transform.prototype._valsToMat = function()
	{
		var m = this._tmat;

		var sx = this._scaleX;
		var sy = this._scaleY;
		var sz = this._scaleZ;

		var r = -0.01745329252;
		var a =  this._rotationX*r;	// alpha
		var b =  this._rotationY*r;	// beta
		var g =  this._rotationZ*r;	// gama

		var ca = Math.cos(a), cb = Math.cos(b), cg = Math.cos(g);
		var sa = Math.sin(a), sb = Math.sin(b), sg = Math.sin(g);

		m[0] = cb*cg*sx;			m[1] = -cb*sg*sx;				m[2 ] = sb*sx;
		m[4] = (ca*sg+sa*sb*cg)*sy;	m[5] = (ca*cg-sa*sb*sg)*sy;		m[6 ] = -sa*cb*sy;
		m[8] = (sa*sg-ca*sb*cg)*sz;	m[9] = (sa*cg+ca*sb*sg)*sz;		m[10] = ca*cb*sz;
	}

	Transform.prototype._matToVals = function()
	{
		var a = this._tmat;

		var a00 = a[0], a01 = a[1], a02 = a[2 ],
			a10 = a[4], a11 = a[5], a12 = a[6 ],
			a20 = a[8], a21 = a[9], a22 = a[10];

		this._scaleX = Math.sqrt(a00*a00 + a01*a01 + a02*a02);
		this._scaleY = Math.sqrt(a10*a10 + a11*a11 + a12*a12);
		this._scaleZ = Math.sqrt(a20*a20 + a21*a21 + a22*a22);
		var isX = 1/this._scaleX, isY = 1/this._scaleY, isZ = 1/this._scaleZ;

		a00 *= isX;  a01 *= isX;  a02 *= isX;
		a10 *= isY;  a11 *= isY;  a12 *= isY;
		a20 *= isZ;  a21 *= isZ;  a22 *= isZ;

		var r = -57.29577951308;
		this._rotationX = r*Math.atan2(-a12, a22);
		this._rotationY = r*Math.atan2(a02, Math.sqrt(a12*a12 + a22*a22));
		this._rotationZ = r*Math.atan2(-a01, a00);
	}

	Transform.prototype._checkVals = function() { if(this._vdirty) {this._matToVals(); this._vdirty = false;} }
	Transform.prototype._checkMat  = function() { if(this._mdirty) {this._valsToMat(); this._mdirty = false;} }

	Transform.prototype._setOPos = function(m)
	{
		var m = this._tmat;
		this._obj.x = m[12];  this._obj.y = m[13];  this._obj.z = m[14];
	}

	Transform.prototype._checkColorID = function()
	{
		var m = this._cmat;
		var v = this._cvec;
		this._cID = m[15] == 1 &&
					m[0 ]==1 && m[1 ]==0 && m[2 ]==0 && m[3 ]==0 &&
					m[4 ]==0 && m[5 ]==1 && m[6 ]==0 && m[7 ]==0 &&
					m[8 ]==0 && m[9 ]==0 && m[10]==1 && m[11]==0 &&
					m[12]==0 && m[13]==0 && m[14]==0 && m[15]==1 &&
					v[0 ]==0 && v[1 ]==0 && v[2 ]==0 && v[3 ]==0 ;
	}

	Transform.prototype._setMat3 = function(m3){ var m4 = this._tmat; m4[0]=m3[0]; m4[1]=m3[1]; m4[4]=m3[3]; m4[5]=m3[4]; m4[12]=m3[6]; m4[13]=m3[7]; }
	Transform.prototype._getMat3 = function(m3){ var m4 = this._tmat; m3[0]=m4[0]; m3[1]=m4[1]; m3[3]=m4[4]; m3[4]=m4[5]; m3[6]=m4[12]; m3[7]=m4[13]; }

	Transform.prototype._setCMat5 = function(m5){ var m4 = this._cmat, v4 = this._cvec;           for(var i=0; i<4; i++) { v4[i]=m5[20+i];  for(var j=0; j<4; j++) m4[4*i+j]=m5[5*i+j]; } }
	Transform.prototype._getCMat5 = function(m5){ var m4 = this._cmat, v4 = this._cvec; m5[24]=1; for(var i=0; i<4; i++) { m5[20+i]=v4[i];  for(var j=0; j<4; j++) m5[5*i+j]=m4[4*i+j]; } }


	Transform.prototype.__defineSetter__("matrix",   function(m){ this._checkMat(); this._setMat3(m); this._setOPos(); this._vdirty = true; });
	Transform.prototype.__defineGetter__("matrix",   function( ){ this._checkMat(); var m = new Float32Array(9); this._getMat3(m); return m; });

	Transform.prototype.__defineSetter__("matrix3D", function(m){ this._checkMat(); Point._m4.set(m, this._tmat); this._setOPos(); this._vdirty = true; });
	Transform.prototype.__defineGetter__("matrix3D", function( ){ this._checkMat(); return Point._m4.create(this._getTMat()); });

	Transform.prototype.__defineSetter__("colorTransform", function(m){ this._setCMat5(m); this._checkColorID(); });
	Transform.prototype.__defineGetter__("colorTransform", function( ){ var m = new Float32Array(25); this._getCMat5(m); return m; });


function EventDispatcher()
{
	this.lsrs = {};		// hash table for listeners ... Key (Event type) : Array of functions
	this.cals = {};		// hash table for objects   ... Key (Event type) : Array of Objects, on which function should be called
}

EventDispatcher.efbc = [];	// objects, on which EnterFrame will be broadcasted

EventDispatcher.prototype.hasEventListener = function(type)
{
	var fs = this.lsrs[type];		// functions for this event
	if (fs == null) return false;
	return (fs.length > 0);
}

EventDispatcher.prototype.addEventListener = function(type, f)
{
	this.addEventListener2(type, f, null);
}

EventDispatcher.prototype.addEventListener2 = function(type, f, o)	// string, function
{
	if(this.lsrs[type] == null)
	{
		this.lsrs[type] = [];
		this.cals[type] = [];
	}
	this.lsrs[type].push(f);
	this.cals[type].push(o);

	if(type == Event.ENTER_FRAME)
	{
		var arEF = EventDispatcher.efbc;
		if(arEF.indexOf(this) < 0) arEF.push(this);
	}
}

EventDispatcher.prototype.removeEventListener = function(type, f)	// string, function
{
	var fs = this.lsrs[type];		// functions for this event
	if (fs == null) return;
	var ind = fs.indexOf(f);
	if(ind < 0) return;
	var cs = this.cals[type];
	fs.splice(ind, 1);
	cs.splice(ind, 1);

	if(type == Event.ENTER_FRAME && fs.length == 0)
	{
		var arEF = EventDispatcher.efbc;
		arEF.splice(arEF.indexOf(this), 1);
	}
}

EventDispatcher.prototype.dispatchEvent = function(e)	// Event
{
	var fs = this.lsrs[e.type];
	if (fs == null) return;
	var cs = this.cals[e.type];
	for (var i=0; i<fs.length; i++)
	{
		e.currentTarget = this;
		if(e.target == null) e.target = this;
		if(cs[i] == null) fs[i](e);
		else fs[i].call(cs[i], e);
	}
}

function Event(type, bubbles)
{
	if(!bubbles) bubbles= false;
	this.type			= type;
	this.target			= null;
	this.currentTarget	= null;
	this.bubbles		= bubbles;
}

Event.ENTER_FRAME			= "enterFrame";
Event.RESIZE				= "resize";
Event.ADDED_TO_STAGE 		= "addedToStage";
Event.REMOVED_FROM_STAGE 	= "removedFromStage";

Event.CHANGE				= "change";

Event.OPEN					= "open";
Event.PROGRESS				= "progress";
Event.COMPLETE				= "complete";//	package net.ivank.events;

function MouseEvent(type, bubbles)
{
	Event.call(this, type, bubbles);

	this.movementX = 0;
	this.movementY = 0;
}
MouseEvent.prototype = new Event();


MouseEvent.CLICK		= "click";
MouseEvent.MOUSE_DOWN	= "mouseDown";
MouseEvent.MOUSE_UP		= "mouseUp";

MouseEvent.MIDDLE_CLICK	= "middleClick";
MouseEvent.MIDDLE_MOUSE_DOWN	= "middleMouseDown";
MouseEvent.MIDDLE_MOUSE_UP		= "middleMouseUp";

MouseEvent.RIGHT_CLICK	= "rightClick";
MouseEvent.RIGHT_MOUSE_DOWN	= "rightMouseDown";
MouseEvent.RIGHT_MOUSE_UP	= "rightMouseUp";


MouseEvent.MOUSE_MOVE	= "mouseMove";
MouseEvent.MOUSE_OVER	= "mouseOver";
MouseEvent.MOUSE_OUT	= "mouseOut";//	package net.ivank.display;


function KeyboardEvent(type, bubbles)
{
	Event.call(this, type, bubbles);

	this.altKey = false;
	this.ctrlKey = false;
	this.shiftKey = false;

	this.keyCode = 0;
	this.charCode = 0;
}
KeyboardEvent.prototype = new Event();

KeyboardEvent.prototype._setFromDom = function(e)
{
	this.altKey		= e.altKey;
	this.ctrlKey	= e.ctrlKey;
	this.shiftKey	= e.ShiftKey;

	this.keyCode	= e.keyCode;
	this.charCode	= e.charCode;
}

KeyboardEvent.KEY_DOWN	= "keyDown";
KeyboardEvent.KEY_UP	= "keyUp";


	var BlendMode =
	{
		NORMAL		: "normal",
		ADD			: "add",
		SUBTRACT	: "subtract",
		MULTIPLY	: "multiply",
		SCREEN		: "screen",

		ERASE		: "erase",
		ALPHA		: "alpha"
	}
	/**
	 * A basic class in the Display API
	 *
	 * @author Ivan Kuckir
	 * @version 1.0
	 */
	function DisplayObject()
	{
		EventDispatcher.call(this);

		this.visible	= true;

		this.parent		= null;
		this.stage		= null;

		this.transform	= new Transform();
		this.transform._obj = this;

		this.blendMode	= BlendMode.NORMAL;

		//	for fast access
		this.x			= 0;
		this.y			= 0;
		this.z			= 0;

		this._brect		= new Rectangle(0, 0, 0, 0);

		this._temp		= new Float32Array(2);
		this._temp2		= new Float32Array(2);
		this._tempm		= Point._m4.create();

		this._atsEv	= new Event(Event.ADDED_TO_STAGE);
		this._rfsEv	= new Event(Event.REMOVED_FROM_STAGE);
		this._atsEv.target = this._rfsEv.target = this;
	}
	DisplayObject.prototype = new EventDispatcher();

	DisplayObject.prototype.dispatchEvent = function(e)	// : returns the deepest active InteractiveObject of subtree
	{
		EventDispatcher.prototype.dispatchEvent.call(this, e);
		if(e.bubbles && this.parent != null) this.parent.dispatchEvent(e);
	}

	DisplayObject.prototype.globalToLocal = function(p)
	{
		var t = this._temp;
		t[0] = p.x;  t[1] = p.y;
		Point._m4.multiplyVec2(this._getAIMat(), t, t);
		return new Point(t[0], t[1]);
	}

	DisplayObject.prototype.localToGlobal = function(p)
	{
		var t = this._temp;
		t[0] = p.x;  t[1] = p.y;
		Point._m4.multiplyVec2(this._getATMat(), t, t);
		return new Point(t[0], t[1]);
	}

	DisplayObject.prototype.hitTestPoint = function(p)
	{
		var t = this._temp2;
		t[0] = p.x;  t[1] = p.y;
		Point._m4.multiplyVec2(this._getAIMat(), t, t);	// global to local
		Point._m4.multiplyVec2(this.transform._getTMat(), t, t);	// local to parent
		return this._htpLocal(t);
	}

	DisplayObject.prototype.hitTestObject = function(obj)
	{
		var r1 = this._getRect(false);
		var r2 = obj ._getRect(false);
		if(!r1 || !r2) return false;

		var m1 = this._getATMat();
		var m2 = obj ._getATMat();

		var rr1 = r1.clone(), rr2 = r2.clone();
		rr1._setAndTransform(r1, m1);
		rr2._setAndTransform(r2, m2);

		return rr1.intersects(rr2);
	}

	DisplayObject.prototype.getRect = function(tcs)
	{
		return this._makeRect(false, tcs);
	}

	DisplayObject.prototype.getBounds = function(tcs)
	{
		return this._makeRect(true , tcs);
	}

	DisplayObject.prototype._makeRect = function(strokes, tcs)
	{
		var or = this._getRect(strokes);
		var m = this._tempm;
		Point._m4.multiply(this._getATMat(), tcs._getAIMat(), m);
		var r = new Rectangle(6710886.4,6710886.4,0,0);
		if(or) r._setAndTransform(or, m);
		return r;
	}

	/*
		Check, whether object hits pt[0], pt[1] in parent coordinate system
	*/

	DisplayObject.prototype._htpLocal = function(pt)
	{
		var t = this._temp;
		Point._m4.multiplyVec2(this.transform._getIMat(), pt, t);
		var r = this._getRect();
		if(r == null) return false;
		return r.contains(t[0], t[1]);
	}

	/*
		Returns the deepest InteractiveObject of subtree with mouseEnabled = true
	*/

	DisplayObject.prototype._moveMouse = function(nx, ny, chColl)
	{
		return null;
	}

	/**
	 * Returns a bounding rectangle of a display object, in local coordinate system.
	 *
	 * @stks 	check strokes
	 * @return 	a bounding rectangle
	 */
	DisplayObject.prototype._getRect = function(stks){return this._brect;}


	DisplayObject.prototype._setStage = function(st)
	{
		var pst = this.stage;	// previous stage
		this.stage = st;
		if(pst == null && st != null) this.dispatchEvent(this._atsEv);
		if(pst != null && st == null) this.dispatchEvent(this._rfsEv);
	}

	/**
	 * This method adds a drawing matrix onto the OpenGL stack
	 */
	DisplayObject.prototype._preRender = function(st)
	{
		var m = this.transform._getTMat();
		st._mstack.push(m);
		st._cmstack.push(this.transform._cmat, this.transform._cvec, this.transform._cID, this.blendMode);
	}



	/**
	 * This method renders the current content
	 */
	DisplayObject.prototype._render = function(st)
	{
	}

	/**
	 * This method renders the whole object
	 */
	DisplayObject.prototype._renderAll = function(st)
	{
		if(!this.visible) return;

		this._preRender(st);
		this._render(st);
		st._mstack.pop();
		st._cmstack.pop();
	}

	/*
		Absolute Inverse Transform matrix
	*/

	DisplayObject.prototype._getATMat = function()
	{
		if(this.parent == null) return this.transform._getTMat();
		Point._m4.multiply(this.parent.transform._getTMat(), this.transform._getTMat(), this.transform._atmat);
		return this.transform._atmat;
	}

	/*
		Absolute Inverse Transform matrix
	*/

	DisplayObject.prototype._getAIMat = function()
	{
		if(this.parent == null) return this.transform._getIMat();
		Point._m4.multiply(this.transform._getIMat(), this.parent._getAIMat(), this.transform._aimat);
		return this.transform._aimat;
	}

	DisplayObject.prototype._getMouse = function()
	{
		var t = this._temp;
		t[0] = Stage._mouseX;  t[1] = Stage._mouseY;
		Point._m4.multiplyVec2(this._getAIMat(), t, t);
		return t;
	}

	this.dp = DisplayObject.prototype;
	dp.ds = dp.__defineSetter__;
	dp.dg = dp.__defineGetter__;

	/*
	dp.ds("x", function(x){this._tmat[12] = x; this._imat[12] = -x;});
	dp.ds("y", function(y){this._tmat[13] = y; this._imat[13] = -y;});
	dp.ds("z", function(z){this._tmat[14] = z; this._imat[14] = -z;});
	dp.dg("x", function( ){return this._tmat[12];});
	dp.dg("y", function( ){return this._tmat[13];});
	dp.dg("z", function( ){return this._tmat[14];});
	*/

	dp.ds("scaleX", function(sx){this.transform._checkVals(); this.transform._scaleX = sx; this.transform._mdirty = true;});
	dp.ds("scaleY", function(sy){this.transform._checkVals(); this.transform._scaleY = sy; this.transform._mdirty = true;});
	dp.ds("scaleZ", function(sz){this.transform._checkVals(); this.transform._scaleZ = sz; this.transform._mdirty = true;});
	dp.dg("scaleX", function(  ){this.transform._checkVals(); return this.transform._scaleX;});
	dp.dg("scaleY", function(  ){this.transform._checkVals(); return this.transform._scaleY;});
	dp.dg("scaleZ", function(  ){this.transform._checkVals(); return this.transform._scaleZ;});

	dp.ds("rotationX", function(r){this.transform._checkVals(); this.transform._rotationX = r; this.transform._mdirty = true;});
	dp.ds("rotationY", function(r){this.transform._checkVals(); this.transform._rotationY = r; this.transform._mdirty = true;});
	dp.ds("rotationZ", function(r){this.transform._checkVals(); this.transform._rotationZ = r; this.transform._mdirty = true;});
	dp.ds("rotation" , function(r){this.transform._checkVals(); this.transform._rotationZ = r; this.transform._mdirty = true;});
	dp.dg("rotationX", function( ){this.transform._checkVals(); return this.transform._rotationX;});
	dp.dg("rotationY", function( ){this.transform._checkVals(); return this.transform._rotationY;});
	dp.dg("rotationZ", function( ){this.transform._checkVals(); return this.transform._rotationZ;});
	dp.dg("rotation" , function( ){this.transform._checkVals(); return this.transform._rotationZ;});


	dp.ds("alpha", function(a){ this.transform._cmat[15] = a; this.transform._checkColorID(); });
	dp.dg("alpha", function( ){ return this.transform._cmat[15]; });


	dp.dg("mouseX", function(){return this._getMouse()[0];});
	dp.dg("mouseY", function(){return this._getMouse()[1];});

	delete(dp.ds);
	delete(dp.dg);
	delete(this.dp);


		function InteractiveObject()
		{
			DisplayObject.call(this);

			this.buttonMode = false;
			this.mouseEnabled = true;
		}
		InteractiveObject.prototype = new DisplayObject();


		InteractiveObject.prototype._moveMouse = function(nx, ny, chColl)
		{
			if(!chColl || !this.visible || !this.mouseEnabled) return null;

			var r = this._getRect();
			if(r == null) return null;

			var t = this._temp;
			t[0] = nx; t[1] = ny;
			Point._m4.multiplyVec2(this.transform._getIMat(), t, t);
			if(r.contains(t[0], t[1])) return this;
			return null;
		}

	/**
	 * A basic container class in the Display API
	 *
	 * @author Ivan Kuckir
	 * @version 1.0
	 */
	function DisplayObjectContainer()
	{
		InteractiveObject.call(this);

		this.numChildren = 0;
		this.mouseChildren = true;

		this._children = [];
		this._brect2 = new Rectangle(0,0,0,0);
	}
	DisplayObjectContainer.prototype = new InteractiveObject();


	/**
	 * Adds a child to the container
	 *
	 * @param o	a chil object to be added
	 */
	DisplayObjectContainer.prototype.addChild = function(o)
	{
		this._children.push(o);
		o.parent = this;
		o._setStage(this.stage);
		++ this.numChildren;
	}

	/**
	 * Removes a child from the container
	 *
	 * @param o	a child object to be removed
	 */
	DisplayObjectContainer.prototype.removeChild = function(o)
	{
		var ind = this._children.indexOf(o);
		if(ind<0) return;
		this._children.splice(ind, 1);
		o.parent = null;
		o._setStage(null);
		-- this.numChildren;
	}

	DisplayObjectContainer.prototype.removeChildAt = function(i)
	{
		this.removeChild(this._children[i]);
	}

	DisplayObjectContainer.prototype.removeChildren = function(beginIndex, endIndex)
	{
		if (typeof beginIndex != 'number')  beginIndex = 0;
		if (typeof endIndex != 'number')  endIndex = this.numChildren;
		var count = endIndex - beginIndex;
		if (count <= 0)  return;
		for (var i = beginIndex; i < endIndex; i++)
		{
			var c = this._children[i];
			c.parent = null;
			c._setStage(null);
		}
		this._children.splice(beginIndex, count);
		this.numChildren -= count;
	}

	/**
	 * Checks, if a container contains a certain child
	 *
	 * @param o	an object for which we check, if it is contained or not
	 * @return	true if contains, false if not
	 */
	DisplayObjectContainer.prototype.contains = function(o)
	{
		return (this._children.indexOf(o)>=0);
	}

	DisplayObjectContainer.prototype.getChildIndex = function(o)
	{
		return this._children.indexOf(o);
	}

	/**
	 * Sets the child index in the current children list.
	 * Child index represents a "depth" - an order, in which children are rendered
	 *
	 * @param c1	a child object
	 * @param i2	a new depth value
	 */
	DisplayObjectContainer.prototype.setChildIndex = function(c1, i2)
	{
		var i1 = this._children.indexOf(c1);

		if(i2>i1)
		{
			for(var i= i1+1; i<= i2; i++) this._children[i-1] = this._children[i];
			this._children[i2] = c1;
		}
		else if(i2<i1)
		{
			for(var i= i1-1; i>= i2; i--) this._children[i+1] = this._children[i];
			this._children[i2] = c1;
		}
	}


	/**
	 * Returns the child display object instance that exists at the specified index.
	 *
	 * @param i	index (depth)
	 * @return	an object at this index
	 */
	DisplayObjectContainer.prototype.getChildAt = function(i)
	{
		return this._children[i];
	}


	DisplayObjectContainer.prototype._render = function(st)
	{
		for(var i=0; i<this.numChildren; i++) this._children[i]._renderAll(st);
	}



	DisplayObjectContainer.prototype._moveMouse = function(nx, ny, chColl)
	{
		if(!chColl || !this.visible || (!this.mouseChildren && !this.mouseEnabled)) return null;
		var t = this._temp;
		t[0] = nx; t[1] = ny;
		Point._m4.multiplyVec2(this.transform._getIMat(), t, t);

		var mx = t[0], my = t[1];

		var chc = chColl;
		var topTGT = null;
		var n = this.numChildren - 1;

		for(var i=n; i>-1; i--)
		{
			var ntg = this._children[i]._moveMouse(mx, my, chc);
			if(ntg != null) {topTGT = ntg;  break;}
		}
		if(!this.mouseChildren && topTGT != null) return this;
		return topTGT;
	}

		/*
		Check, whether object hits pt[0], pt[1] in parent coordinate system
	*/

	DisplayObjectContainer.prototype._htpLocal = function(pt)
	{
		var t = this._temp;
		Point._m4.multiplyVec2(this.transform._getIMat(), pt, t);

		var n = this._children.length;
		for(var i=0; i<n; i++)
		{
			var ch = this._children[i];
			if(ch.visible) if(ch._htpLocal(t)) return true;
		}
		return false;
	}

	DisplayObjectContainer.prototype._setStage = function(st)
	{
		InteractiveObject.prototype._setStage.call(this, st);
		for(var i=0; i<this.numChildren; i++) this._children[i]._setStage(st);
	}

	DisplayObjectContainer.prototype._getRect = function(stks)
	{
		if(this.numChildren == 0) return null;

		var r = null;
		var r2 = this._brect2;

		for(var i=0; i<this.numChildren; i++)
		{
			var ch = this._children[i];
			var cr = ch._getRect(stks);
			if(!ch.visible || cr == null) continue;
			if(r == null){r = this._brect; r._setAndTransform(cr, ch.transform._getTMat());}
			else{ r2._setAndTransform(cr, ch.transform._getTMat()); r._unionWith(r2);}
		}
		return r;
	}



	function SubImage(img, x, y, w, h)
	{
		// Image element
		this.img = img;
		// start coordinates
		this.x = x;
		this.y = y;
		// width and height
		this.w = w;
		this.h = h;
	}

	function BitmapData(imgURL)
	{
		// public
		this.width = 0;							// size of texture
		this.height = 0;
		this.rect = null;						// real BD height
		this.loader = new EventDispatcher();
		this.loader.bytesLoaded = 0;
		this.loader.bytesTotal = 0;

		// private
		this._img = null;
		this._texture = gl.createTexture();
		this._rwidth = 0;						// real size of bitmap in memory (power of two)
		this._rheight = 0;
		this._tcBuffer = gl.createBuffer();		//	texture coordinates buffer
		this._vBuffer  = gl.createBuffer();		//	four vertices of bitmap
		this._loaded = false;

		this._opEv = new Event(Event.OPEN);
		this._pgEv = new Event(Event.PROGRESS);
		this._cpEv = new Event(Event.COMPLETE);

		this._opEv.target = this._pgEv.target = this._cpEv.target = this.loader;

		if(imgURL == null) return;

		var bd = this;
		if (imgURL instanceof SubImage) {
			var i = imgURL;
			this._initFromImg(i.img, i.img.width, i.img.height, i.x, i.y, i.x + i.w, i.y + i.h);
			this.loader.dispatchEvent(this._cpEv);
		} else {
			var img = this._img = document.createElement("img");
			img.onload		= function(e) {
				bd._initFromImg(img, img.width, img.height);
				bd.loader.dispatchEvent(bd._cpEv);
			};
			img.src = imgURL;
		}
	}

	/* public */

	BitmapData.empty = function(w, h)
	{
		var bd = new BitmapData(null);
		bd._initFromImg(null, w, h);
		return bd;
	}

	BitmapData.prototype.setPixels = function(r, buff)
	{
		Stage._setTEX(this._texture);
		gl.texSubImage2D(gl.TEXTURE_2D, 0, r.x, r.y, r.width, r.height,  gl.RGBA, gl.UNSIGNED_BYTE, buff);
		gl.generateMipmap(gl.TEXTURE_2D);
	}

	BitmapData.prototype.getPixels = function(r, buff)
	{
		if(!buff) buff = new Uint8Array(r.width * r.height * 4);
		this._setTexAsFB();
		gl.readPixels(r.x, r.y, r.width, r.height, gl.RGBA, gl.UNSIGNED_BYTE, buff);
		Stage._main._setFramebuffer(null, Stage._main.stageWidth, Stage._main.stageHeight, false);
		return buff;
	}

	BitmapData.prototype.draw = function(dobj)
	{
		this._setTexAsFB();
		dobj._render(Stage._main);
		Stage._main._setFramebuffer(null, Stage._main.stageWidth, Stage._main.stageHeight, false);

		Stage._setTEX(this._texture);
		gl.generateMipmap(gl.TEXTURE_2D);

	}

	/* private */

	BitmapData.prototype._setTexAsFB = function()
	{
		if(BitmapData._fbo == null)
		{
			BitmapData._fbo = gl.createFramebuffer();
			var rbo = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
			gl.bindFramebuffer(gl.FRAMEBUFFER, BitmapData._fbo);
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);
		}

		Stage._main._setFramebuffer(BitmapData._fbo, this._rwidth, this._rheight, true);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture, 0);
	}

	BitmapData.prototype._initFromImg = function(img, w, h, x0, y0, x1, y1)
	{
		if (x0 === undefined) x0 = 0;
		if (y0 === undefined) y0 = 0;
		if (x1 === undefined) x1 = w;
		if (y1 === undefined) y1 = h;
		w = x1 - x0;
		h = y1 - y0;

		this._loaded = true;
		this.width = w;			// image width
		this.height = w;		// image.height
		this._rwidth = BitmapData._nhpot(w);	// width - power of Two
		this._rheight = BitmapData._nhpot(h);	// height - power of Two
		this.rect = new Rectangle(0,0,w,h);

		var xsc = w/this._rwidth;
		var ysc = h/this._rheight;

		Stage._setBF(this._tcBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, xsc,0, 0,ysc, xsc,ysc]), gl.STATIC_DRAW);

		Stage._setBF(this._vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,0, w,0,0, 0,h,0, w,h,0]), gl.STATIC_DRAW);

		var canv = BitmapData._canv;
		canv.width = this._rwidth;
		canv.height = this._rheight;
		var ctx = BitmapData._ctx;
		if(img != null) ctx.drawImage(img, -x0, -y0);

		var data = ctx.getImageData(0, 0, this._rwidth, this._rheight);

		Stage._setTEX(this._texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);
	}

BitmapData._canv = document.createElement("canvas");
BitmapData._ctx = BitmapData._canv.getContext("2d");


BitmapData._ipot = function(x) {
    return (x & (x - 1)) == 0;
}

BitmapData._nhpot = function(x) {
    --x;
    for (var i = 1; i < 32; i <<= 1)   x = x | x >> i;
    return x + 1;
}















	/**
	 * A basic class for rendering bitmaps
	 *
	 * @author Ivan Kuckir
	 * @version 1.0
	 */
	function Bitmap(bd)
	{
		DisplayObject.call(this);
		this.bitmapData = bd;
	}
	Bitmap.prototype = new InteractiveObject();		// this Bitmap is InteractiveObject !!!

	Bitmap.prototype._getRect = function()
	{
		return this.bitmapData.rect;
	}

	Bitmap.prototype._render = function(st)
	{
		//return;
		var tbd = this.bitmapData;
		if(!tbd._loaded) return;
		gl.uniformMatrix4fv(st._sprg.tMatUniform, false, st._mstack.top());
		st._cmstack.update();

		Stage._setVC(tbd._vBuffer);
		Stage._setTC(tbd._tcBuffer);
		Stage._setUT(1);
		Stage._setTEX(tbd._texture);
		Stage._setEBF(st._unitIBuffer);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	}

    var gl;

    function Stage(canvID)
	{
		DisplayObjectContainer.call(this);
		document.body.style.margin="0";

		this.stage = this;

		this.stageWidth = 0;
		this.stageHeight = 0;

		this.focus   = null;			// keyboard focus, never Stage
		this._focii = [null, null, null];
		this._mousefocus = null;		// mouse focus of last mouse move, used to detect MOUSE_OVER / OUT, never Stage

		this._useHand = false;
		this._knM = false;	// know mouse
		this._mstack = new Stage._MStack();
		this._cmstack = new Stage._CMStack();
		this._sprg = null;

		this._pmat = Point._m4.create([
			 1, 0, 0, 0,
			 0, 1, 0, 0,
			 0, 0, 1, 1,
			 0, 0, 0, 1
		]);	// project matrix

		this._umat = Point._m4.create([
			 2, 0, 0, 0,
			 0,-2, 0, 0,
			 0, 0, 2, 0,
			-1, 1, 0, 1
		]);	// unit matrix

		this._smat = Point._m4.create([
			 0, 0, 0, 0,
			 0, 0, 0, 0,
			 0, 0, 0.001, 0,
			 0, 0, 0, 1
		]);	// scale matrix

		this._efEv = new Event(Event.ENTER_FRAME);
		this._rsEv = new Event(Event.RESIZE);

		this._mcEvs = [	new MouseEvent(MouseEvent.CLICK			,true),
						new MouseEvent(MouseEvent.MIDDLE_CLICK	,true),
						new MouseEvent(MouseEvent.RIGHT_CLICK	,true) ];

		this._mdEvs = [ new MouseEvent(MouseEvent.MOUSE_DOWN		,true),
						new MouseEvent(MouseEvent.MIDDLE_MOUSE_DOWN	,true),
						new MouseEvent(MouseEvent.RIGHT_MOUSE_DOWN	,true) ];

		this._muEvs = [ new MouseEvent(MouseEvent.MOUSE_UP			,true),
						new MouseEvent(MouseEvent.MIDDLE_MOUSE_UP	,true),
						new MouseEvent(MouseEvent.RIGHT_MOUSE_UP	,true) ];

		this._mmoEv = new MouseEvent(MouseEvent.MOUSE_MOVE,	true);
		this._movEv = new MouseEvent(MouseEvent.MOUSE_OVER,	true);
		this._mouEv = new MouseEvent(MouseEvent.MOUSE_OUT,	true);

		this._kdEv = new KeyboardEvent(KeyboardEvent.KEY_DOWN, true);
		this._kuEv = new KeyboardEvent(KeyboardEvent.KEY_UP, true);

		this._smd   = [false, false, false];
		this._smu   = [false, false, false];

		this._smm  = false;	// stage mouse move
		this._srs  = false;	// stage resized

		this._canvas = this.canvas = document.getElementById(canvID);

		Stage._main = this;

		var par = { alpha:true, antialias:true, depth:true, premultipliedAlpha:true };
		var c = this.canvas;
		gl = c.getContext("webgl", par);
		if (!gl) gl = c.getContext("experimental-webgl", par);
		if (!gl) alert("Could not initialize WebGL. Try to update your browser or graphic drivers.");

		//if(WebGLDebugUtils) WebGLDebugUtils.makeDebugContext(gl);

		c.style["-webkit-user-select"] = "none";

		var d = document;
		// Listen on canvas so we don't interfere with external elements.
		c.addEventListener("contextmenu",		Stage._ctxt, false);
		c.addEventListener("dragstart",			Stage._blck, false);

		if(Stage._isTD())
		{
			c.addEventListener("touchstart",	Stage._onTD, false);
			c.addEventListener("touchmove",		Stage._onTM, false);
			c.addEventListener("touchend",		Stage._onTU, false);
			c.addEventListener("touchstart",	Stage._blck, false);
			c.addEventListener("touchmove",		Stage._blck, false);
			c.addEventListener("touchend",		Stage._blck, false);
		}
		else
		{
			c.addEventListener("mousedown",		Stage._onMD, false);
			c.addEventListener("mousemove",		Stage._onMM, false);
			c.addEventListener("mouseup",		Stage._onMU, false);
			//c.addEventListener("mousedown",		Stage._blck, false);
			//c.addEventListener("mousemove",		Stage._blck, false);
			//c.addEventListener("mouseup",		Stage._blck, false);
		}
		c.addEventListener("keydown",	Stage._onKD, false);
		c.addEventListener("keyup",		Stage._onKU, false);
		c.addEventListener("keydown",	Stage._blck, false);
		c.addEventListener("keyup",		Stage._blck, false);

		window.addEventListener("resize",	Stage._onRS, false);

        this._initShaders();
        this._initBuffers();

        gl.clearColor(0, 0, 0, 0);

		gl.enable(gl.BLEND);
		gl.blendEquation(gl.FUNC_ADD);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);

		this._resize();
		this._srs = true;
        _requestAF(Stage._tick);
    }
	Stage.prototype = new DisplayObjectContainer();

	Stage._mouseX = 0;
	Stage._mouseY = 0;

	Stage._curBF = -1;
	Stage._curEBF = -1;

	Stage._curVC = -1;
	Stage._curTC = -1;
	Stage._curUT = -1;
	Stage._curTEX = -1;

	Stage._curBMD = "normal";

	Stage._setBF = function(bf)
	{
		if(Stage._curBF != bf) {
			gl.bindBuffer(gl.ARRAY_BUFFER, bf);
			Stage._curBF = bf;
		}
	}
	Stage._setEBF = function(ebf)
	{
		if(Stage._curEBF != ebf) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebf);
			Stage._curEBF = ebf;
		}
	}
	Stage._setVC = function(vc)
	{
		if(Stage._curVC != vc) {
			gl.bindBuffer(gl.ARRAY_BUFFER, vc);
			gl.vertexAttribPointer(Stage._main._sprg.vpa, 3, gl.FLOAT, false, 0, 0);
			Stage._curVC = Stage._curBF = vc;
		}
	}
	Stage._setTC = function(tc)
	{
		if(Stage._curTC != tc) {
			gl.bindBuffer(gl.ARRAY_BUFFER, tc);
			gl.vertexAttribPointer(Stage._main._sprg.tca, 2, gl.FLOAT, false, 0, 0);
			Stage._curTC = Stage._curBF = tc;
		}
	}
	Stage._setUT = function(ut)
	{
		if(Stage._curUT != ut) {
			gl.uniform1i (Stage._main._sprg.useTex, ut);
			Stage._curUT = ut;
		}
	}
	Stage._setTEX = function(tex)
	{
		if(Stage._curTEX != tex) {
			gl.bindTexture(gl.TEXTURE_2D, tex);
			Stage._curTEX = tex;
		}
	}
	Stage._setBMD = function(bmd)
	{
		if(Stage._curBMD != bmd)
		{
			if		(bmd == BlendMode.NORMAL  ) {
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
			}
			else if	(bmd == BlendMode.MULTIPLY) {
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
			}
			else if	(bmd == BlendMode.ADD)	  {
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ONE, gl.ONE);
			}
			else if (bmd == BlendMode.SUBTRACT) {
				gl.blendEquationSeparate(gl.FUNC_REVERSE_SUBTRACT, gl.FUNC_ADD);
				gl.blendFunc(gl.ONE, gl.ONE);
			}
			else if (bmd == BlendMode.SCREEN) {
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
			}
			else if (bmd == BlendMode.ERASE) {
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
			}
			else if (bmd == BlendMode.ALPHA) {
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ZERO, gl.SRC_ALPHA);
			}
			Stage._curBMD = bmd;
		}
	}

	Stage._okKeys = 	// keyCodes, which are not prevented by IvanK
	[
		112, 113, 114, 115,   116, 117, 118, 119,   120, 121, 122, 123,	// F1 - F12
		13,	// Enter
		16,	// Shift
		//17,	// Ctrl
		18,	// Alt
		27	// Esc
	];

	/** Is Touchscreen Device */
	Stage._isTD = function() { return !!('ontouchstart' in window); }

	Stage._ctxt = function(e){ if(Stage._main.hasEventListener(MouseEvent.RIGHT_CLICK))e.preventDefault();}

	Stage._onTD = function(e){ Stage._setStageMouse(e); Stage._main._smd[0] = true; Stage._main._knM = true;}
	Stage._onTM = function(e){ Stage._setStageMouse(e); Stage._main._smm    = true; Stage._main._knM = true;}
	Stage._onTU = function(e){ Stage._main._smu[0] = true; Stage._main._knM = true;}

	Stage._onMD = function(e){ Stage._setStageMouse(e); Stage._main._smd[e.button] = true; Stage._main._knM = true;}
	Stage._onMM = function(e){ Stage._setStageMouse(e); Stage._main._smm           = true; Stage._main._knM = true;}
	Stage._onMU = function(e){ Stage._main._smu[e.button] = true; Stage._main._knM = true;}

	Stage._onKD = function(e)
	{
		var st = Stage._main;
		st._kdEv._setFromDom(e);
		if(st.focus && st.focus.stage) st.focus.dispatchEvent(st._kdEv); else st.dispatchEvent(st._kdEv);
	}
	Stage._onKU = function(e)
	{
		var st = Stage._main;
		st._kuEv._setFromDom(e);
		if(st.focus && st.focus.stage) st.focus.dispatchEvent(st._kuEv); else st.dispatchEvent(st._kuEv);
	}
	Stage._blck = function(e){ if(e.keyCode != null) {if(Stage._okKeys.indexOf(e.keyCode)==-1) e.preventDefault(); } else e.preventDefault(); }
	Stage._onRS = function(e){ Stage._main._srs = true; }

	Stage.prototype._resize = function()
	{
		// Set this based on canvas, instead of window.
		var w = this._canvas.width;
		var h = this._canvas.height;

		this.stageWidth = w;
		this.stageHeight = h;

		this._setFramebuffer(null, w, h, false);
	}

    Stage.prototype._getShader = function(gl, str, fs) {

        var shader;
        if (fs)	shader = gl.createShader(gl.FRAGMENT_SHADER);
        else	shader = gl.createShader(gl.VERTEX_SHADER);

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }



    Stage.prototype._initShaders = function()
	{
		var fs = "\
			precision mediump float;\
			varying vec2 texCoord;\
			\
			uniform sampler2D uSampler;\
			uniform vec4 color;\
			uniform bool useTex;\
			\
			uniform mat4 cMat;\
			uniform vec4 cVec;\
			\
			void main(void) {\
				vec4 c = useTex ? texture2D(uSampler, texCoord) : color;\
				c = (cMat*c)+cVec;\n\
				c.xyz *= min(c.w, 1.0);\n\
				gl_FragColor = c;\
			}";

		var vs = "\
			attribute vec3 verPos;\
			attribute vec2 texPos;\
			\
			uniform mat4 tMat;\
			\
			varying vec2 texCoord;\
			\
			void main(void) {\
				gl_Position = tMat * vec4(verPos, 1.0);\
				texCoord = texPos;\
			}";

		var fShader = this._getShader(gl, fs, true );
        var vShader = this._getShader(gl, vs, false);

        this._sprg = gl.createProgram();
        gl.attachShader(this._sprg, vShader);
        gl.attachShader(this._sprg, fShader);
        gl.linkProgram(this._sprg);

        if (!gl.getProgramParameter(this._sprg, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(this._sprg);

        this._sprg.vpa		= gl.getAttribLocation(this._sprg, "verPos");
        this._sprg.tca		= gl.getAttribLocation(this._sprg, "texPos");
        gl.enableVertexAttribArray(this._sprg.tca);
		gl.enableVertexAttribArray(this._sprg.vpa);

		this._sprg.tMatUniform		= gl.getUniformLocation(this._sprg, "tMat");
		this._sprg.cMatUniform		= gl.getUniformLocation(this._sprg, "cMat");
		this._sprg.cVecUniform		= gl.getUniformLocation(this._sprg, "cVec");
        this._sprg.samplerUniform	= gl.getUniformLocation(this._sprg, "uSampler");
		this._sprg.useTex			= gl.getUniformLocation(this._sprg, "useTex");
		this._sprg.color			= gl.getUniformLocation(this._sprg, "color");
    }


    Stage.prototype._initBuffers = function()
	{
        this._unitIBuffer = gl.createBuffer();

		Stage._setEBF(this._unitIBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,  1,2,3]), gl.STATIC_DRAW);
    }

	Stage.prototype._setFramebuffer = function(fbo, w, h, flip)
	{
		this._mstack.clear();

		this._mstack.push(this._pmat, 0);
		if(flip)	{ this._umat[5] =  2; this._umat[13] = -1;}
		else		{ this._umat[5] = -2; this._umat[13] =  1;}
		this._mstack.push(this._umat);

		this._smat[0] = 1/w;  this._smat[5] = 1/h;
		this._mstack.push(this._smat);

		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		if(fbo) gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w,h);
		gl.viewport(0, 0, w, h);
	}

	Stage._setStageMouse = function(e)	// event, want X
	{
		var ev = e;
		if(e.type == "touchstart" || e.type == "touchmove" || e.type == "touchend") ev = e.touches.item(0);

		var mx = ev.clientX;// + document.body.scrollLeft + document.documentElement.scrollLeft;
		var my = ev.clientY;// + document.body.scrollTop  + document.documentElement.scrollTop ;
		Stage._mouseX = mx;
		Stage._mouseY = my;
	}

    Stage.prototype._drawScene = function()
	{
		if(this._srs)
		{
			this._resize();
			this.dispatchEvent(this._rsEv);
			this._srs = false;
		}

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		if(this._knM)
		{
			//	proceeding Mouse Events
			var newf = this._moveMouse(Stage._mouseX, Stage._mouseY, true);
			var fa = this._mousefocus || this, fb = newf || this;

			if(newf != this._mousefocus)
			{
				if(fa != this)
				{
					var ev = this._mouEv;
					ev.target = fa;
					fa.dispatchEvent(ev);
				}
				if(fb != this)
				{
					ev = this._movEv;
					ev.target = fb;
					fb.dispatchEvent(ev);
				}
			}

			var sd=this._smd,su=this._smu;
			for(var i=0; i<3; i++)
			{
				this._mcEvs[i].target = this._mdEvs[i].target = this._muEvs[i].target = fb;
				if(sd[i])	{fb.dispatchEvent(this._mdEvs[i]); this._focii[i] = this.focus = newf;}
				if(su[i])	{fb.dispatchEvent(this._muEvs[i]); if(newf == this._focii[i]) fb.dispatchEvent(this._mcEvs[i]); }
				sd[i]=su[i]=false;
			}

			this._mmoEv.target = fb;
			if(this._smm)	{fb.dispatchEvent(this._mmoEv);}
			this._smm=false;

			this._mousefocus = newf;

			//	checking buttonMode
			var uh = false, ob = fb;
			while(ob.parent != null) {uh |= ob.buttonMode; ob = ob.parent;}
			if(uh != this._useHand) this._canvas.style.cursor = uh?"pointer":"default";
			this._useHand = uh;
		}

		//	proceeding EnterFrame
		var efs = EventDispatcher.efbc;
		var ev = this._efEv;
		for(var i=0; i<efs.length; i++)
		{
			ev.target = efs[i];
			efs[i].dispatchEvent(ev);
		}

        this._renderAll(this);
    }



    Stage._tick = function() {
        _requestAF(Stage._tick);
        Stage.prototype._drawScene.call(Stage._main);
    }

	Stage._MStack = function()
	{
		this.mats = [];
		this.size = 1;
		for(var i=0; i<30; i++) this.mats.push(Point._m4.create());
	}

	Stage._MStack.prototype.clear = function()
	{
		this.size = 1;
	}

	Stage._MStack.prototype.push = function(m)
	{
		var s = this.size++;
		Point._m4.multiply(this.mats[s-1], m, this.mats[s]);
	}

	Stage._MStack.prototype.pop = function()
	{
		this.size--;
	}

	Stage._MStack.prototype.top = function()
	{
		return(this.mats[this.size-1]);
	}

	/*
		Color matrix stack
	*/
	Stage._CMStack = function()
	{
		this.mats = [];	//	linear transform matrix
		this.vecs = [];	//  affine shift column
		this.isID = []; //	is Identity

		this.bmds = []; //	blend modes
		this.lnnm = [];	//	last not NORMAL blend mode
		this.size = 1;
		this.dirty = true;	// if top matrix is different than shader value
		for(var i=0; i<30; i++) {	this.mats.push(Point._m4.create()); this.vecs.push(new Float32Array(4));
									this.isID.push(true); this.bmds.push(BlendMode.NORMAL); this.lnnm.push(0); }
	}

	Stage._CMStack.prototype.push = function(m, v, id, bmd)
	{
		var s = this.size++;
		this.isID[s] = id;

		if(id) {
			Point._m4.set(this.mats[s-1], this.mats[s]);
			Point._v4.set(this.vecs[s-1], this.vecs[s]);
		}
		else
		{
			Point._m4.multiply    (this.mats[s-1], m, this.mats[s]);
			Point._m4.multiplyVec4(this.mats[s-1], v, this.vecs[s]);
			Point._v4.add	      (this.vecs[s-1], this.vecs[s], this.vecs[s]);
		}
		if(!id) this.dirty = true;

		this.bmds[s] = bmd;
		this.lnnm[s] = (bmd==BlendMode.NORMAL) ? this.lnnm[s-1] : s;
	}

	Stage._CMStack.prototype.update = function()
	{
		if(this.dirty)
		{
			var st = Stage._main, s = this.size-1;
			gl.uniformMatrix4fv(st._sprg.cMatUniform, false, this.mats[s]);
			gl.uniform4fv      (st._sprg.cVecUniform, this.vecs[s]);
			this.dirty = false;
		}
		var n = this.lnnm[this.size-1];
		Stage._setBMD(this.bmds[n]);
	}

	Stage._CMStack.prototype.pop = function()
	{
		if(!this.isID[this.size-1]) this.dirty = true;
		this.size--;
	}





	/**
	 * A basic class for vector drawing
	 *
	 * @author Ivan Kuckir
	 */
	function Graphics()
	{
		this._px = 0;	// position of drawing pointer
		this._py = 0;

		this._uls	= [];		// universal lines
		this._cvs	= [];		// curves
		this._tgs	= [];		// triangles

		this._elems	= [];		// all the elements

		this._duls	= [];
		this._dcvs	= [];		// deleted curves
		this._dtgs	= {};		// deleted triangles

		this._minx	= Number.POSITIVE_INFINITY;
		this._miny	= this._minx;
		this._maxx	= Number.NEGATIVE_INFINITY;
		this._maxy	= this._maxx;

		// for strokes
		this._sminx	= Number.POSITIVE_INFINITY;
		this._sminy	= this._sminx;
		this._smaxx	= Number.NEGATIVE_INFINITY;
		this._smaxy	= this._smaxx;

		this._brect	= new Rectangle(0,0,0,0);

		this._clstyle	= new LineStyle(1, 0x000000, 1);	// current line style
		this._cfstyle	= new FillStyle(0xff0000, 1);		// current fill style
		this._bdata		= null;

		this._ftype	= 0;		// fill type, 0-color, 1-bitmap
		this._empty	= true;

		/* drawing lines */
		this._lvbuf = gl ? gl.createBuffer() : null;
		this._lvval = new Float32Array(18);				// line vertex values
		this._lused = 0;
		this._ltotal = 1;
		this._ldirty = false;
		this._lsegment = null;
		if(gl) this._sendLBuffers();
	}

	/**
	 * Renders a vector content
	 */
	Graphics.prototype._render = function(st)
	{
		gl.uniformMatrix4fv(st._sprg.tMatUniform, false, st._mstack.top());
		st._cmstack.update();

		if(this._ldirty)
		{
			Stage._setBF(this._lvbuf);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._lvval);
			this._ldirty = false;
		}

		var ar = this._elems;
		for(var i=0; i<ar.length; i++) ar[i].render(st);
	}

	Graphics.prototype._sendLBuffers = function()
	{
		Stage._setBF(this._lvbuf);
		gl.bufferData(gl.ARRAY_BUFFER, this._lvval, gl.STATIC_DRAW);
	}

	Graphics.prototype._newLineSegment = function()
	{
		var nls;
		if(this._duls.length == 0)
			nls = new ULSegment(this._lused, this._clstyle.colARR, this._lvbuf);
		else
		{
			nls = this._duls.pop();
			nls.update(this._lused, this._clstyle.colARR);
		}
		this._uls.push(nls);
		this._elems.push(nls);
		return nls;
	}

	Graphics.prototype._checkLineAvail = function(n)
	{
		var lt = this._ltotal;
		if(lt - this._lused < n)
		{
			lt = Math.max(lt+n, 2*lt);
			var oldv = this._lvval;
			var newv = new Float32Array(18*lt);
			for(var i=0; i<oldv.length; i++) newv[i] = oldv[i];
			this._ltotal = lt;
			this._lvval = newv;
			this._sendLBuffers();
		}
	}

	Graphics.prototype._putLine = function(x1, y1, x2, y2)	// each line: 4 points = 8 floats
	{
		this._updateSBounds(x1, y1);
		this._updateSBounds(x2, y2);

		if(this._lsegment == null) this._lsegment = this._newLineSegment();

		this._checkLineAvail(1);

		var il = 0.5*this._clstyle.thickness/this.len(x1-x2, y1-y2);
		var dx =  il*(y1-y2);
		var dy = -il*(x1-x2);

		var ps = this._lvval;
		var vi = this._lused * 18;
		ps[vi++ ] = x1+dx;	ps[vi++ ] = y1+dy;	vi++;

		ps[vi++ ] = x1-dx;	ps[vi++ ] = y1-dy;	vi++;
		ps[vi++ ] = x2+dx;	ps[vi++ ] = y2+dy;	vi++;

		ps[vi++ ] = x1-dx;	ps[vi++ ] = y1-dy;	vi++;
		ps[vi++ ] = x2+dx;	ps[vi++ ] = y2+dy;	vi++;

		ps[vi++ ] = x2-dx;	ps[vi++ ] = y2-dy;	vi++;

		this._ldirty = true;
		this._lused++;
		this._lsegment.count++;
		this._empty = false;
	}

	/**
	 * Set a line style
	 * @param thickness	line thickness
	 * @param color		line color
	 */
	Graphics.prototype.lineStyle = function(thickness, color, alpha)
	{
		if(!color) color = 0x000000;
		if(!alpha) alpha = 1;
		if(color != this._clstyle.color || alpha != this._clstyle.alpha)
			this._lsegment = null;
		this._clstyle.Set(thickness, color, alpha);
	}

	/**
	 * Begin to fill some shape
	 * @param color	color
	 */
	Graphics.prototype.beginFill = function(color, alpha)
	{
		this._ftype = 0;
		if(!alpha) alpha = 1;
		this._cfstyle.Set(color, alpha);
	}

	Graphics.prototype.beginBitmapFill = function(bdata)
	{
		this._ftype = 1;
		this._bdata = bdata;
	}

	/**
	 * End filling some shape
	 */
	Graphics.prototype.endFill = function() { }

	/**
	 * Move a "drawing brush" to some position
	 * @param x
	 * @param y
	 */
	Graphics.prototype.moveTo = function(x, y)
	{
		this._px = x;  this._py = y;
	}

	/**
	 * Draw a line to some position
	 * @param x
	 * @param y
	 */
	Graphics.prototype.lineTo = function(x2, y2)
	{
		this._putLine(this._px, this._py, x2, y2);
		this._px = x2;	this._py = y2;
	}

	Graphics.prototype.len = function(x, y)
	{
		return Math.sqrt(x*x+y*y);
	}

	Graphics.prototype.curveTo = function(bx, by, cx, cy)
	{
		var ax = this._px, ay = this._py, t = 0.666666;
		this.cubicCurveTo(ax+t*(bx-ax), ay+t*(by-ay), cx+t*(bx-cx), cy+t*(by-cy), cx, cy);
	}

	Graphics.prototype.cubicCurveTo = function(bx, by, cx, cy, dx, dy)
	{
		this._checkLineAvail(40);
		if(this._lsegment == null) this._lsegment = this._newLineSegment();
		/*
				b --- q --- c
			   / 			 \
			  p				  r
			 /				   \
			a					d
		*/
		var ax, ay, px, py, qx, qy, rx, ry, sx, sy, tx, ty,
			tobx, toby, tocx, tocy, todx, tody, toqx, toqy, torx, tory, totx, toty;
		var rad = 0.5*this._clstyle.thickness;
		var il, dix, diy, x, y;

		ax   = this._px;  ay   = this._py;
		tobx = bx - ax;  toby = by - ay;  // directions
		tocx = cx - bx;  tocy = cy - by;
		todx = dx - cx;  tody = dy - cy;
		step = 1/40;

		var prevx, prevy, prevdx, prevdy;
		var ps = this._lvval;
		var vi = this._lused * 18;

		for(var i=0; i<41; i++)
		{
			var d = i*step;
			px = ax +d*tobx;  py = ay +d*toby;
			qx = bx +d*tocx;  qy = by +d*tocy;
			rx = cx +d*todx;  ry = cy +d*tody;
			toqx = qx - px;	  toqy = qy - py;
			torx = rx - qx;	  tory = ry - qy;

			sx = px +d*toqx;  sy = py +d*toqy;
			tx = qx +d*torx;  ty = qy +d*tory;
			totx = tx - sx;   toty = ty - sy;

			x = sx + d*totx;  y = sy + d*toty;

			il = rad/this.len(totx, toty);
			dix =   il*(toty); diy =  -il*(totx);
			this._updateSBounds(x, y);

			if(i>0)
			{
				ps[vi++] = prevx+prevdx;	ps[vi++] = prevy+prevdy;	vi++;
				ps[vi++] = prevx-prevdx;	ps[vi++] = prevy-prevdy;	vi++;
				ps[vi++] = x+dix;			ps[vi++] = y+diy;			vi++;
				ps[vi++] = prevx-prevdx;	ps[vi++] = prevy-prevdy;	vi++;
				ps[vi++] = x+dix;			ps[vi++] = y+diy;			vi++;
				ps[vi++] = x-dix;			ps[vi++] = y-diy;			vi++;
			}
			prevx = x;  prevy = y;  prevdx = dix;  prevdy = diy;
		}

		this._px = dx; this._py = dy;

		this._ldirty = true;
		this._lused += 40;
		this._lsegment.count += 40;
		this._empty = false;
	}

	/**
	 * Draw a circle
	 * @param x		X coordinate of a center
	 * @param y		Y coordinate of a center
	 * @param r		radius
	 */
	Graphics.prototype.drawCircle = function(x, y, r)
	{
		this.drawEllipse(x, y, r*2, r*2);
	}

	/**
	 * Draw an ellipse
	 * @param x		X coordinate of a center
	 * @param y		Y coordinate of a center
	 * @param w		ellipse width
	 * @param h		ellipse height
	 */
	Graphics.prototype.drawEllipse = function(x, y, w, h)
	{
		var d = Math.PI/16;
		var hw = w*0.5;
		var hh = h*0.5;

		var vrt = Graphics._eVrt;

		var j = 0;
		for(var i=0; i<2*Math.PI; i+=d)
		{
			vrt[j++] = x+Math.cos(i)*hw;
			vrt[j++] = y+Math.sin(i)*hh;
		}
		this.drawTriangles(vrt, Graphics._eInd);
	}

	/**
	 * Draws a rectangle
	 * @param x		X coordinate of top left corner
	 * @param y		Y coordinate of top left corner
	 * @param w		width
	 * @param h		height
	 */
	Graphics.prototype.drawRect = function(x, y, w, h)
	{
		var v = Graphics._rVrt;
		v[0] = v[4] = x;
		v[1] = v[3] = y;
		v[2] = v[6] = x+w;
		v[5] = v[7] = y+h;
		this.drawTriangles(v, Graphics._rInd);
	}

	/**
	 * Draws a rectangle with round corners
	 * @param x		X coordinate of top left corner
	 * @param y		Y coordinate of top left corner
	 * @param w		width
	 * @param h		height
	 */
	Graphics.prototype.drawRoundRect = function(x, y, w, h, ew, eh)
	{
		var v = Graphics._rrVrt;
		var d = Math.PI/14;
		if(!eh) eh = ew;
		var hw = ew*0.5;
		var hh = eh*0.5;

		var j = 0;
		var cx = x+hw;
		var cy = y+hh;
		for(var i=-Math.PI; i<=Math.PI; i+=d)
		{
			if(j==16) cx += w - ew;
			if(j==32) cy += h - eh;
			if(j==48) cx -= w - ew;
			if(j>0 && (j&15)==0) i -= d;
			v[j++] = cx+Math.cos(i)*hw;
			v[j++] = cy+Math.sin(i)*hh;
		}
		this.drawTriangles(v, Graphics._rrInd);
	}

	Graphics.prototype.drawTriangles = function(vrt, ind, uvt)
	{
		this._drawTGS(vrt, ind, uvt, 2);
	}

	Graphics.prototype.drawTriangles3D = function(vrt, ind, uvt)
	{
		this._drawTGS(vrt, ind, uvt, 3);
	}

	// vertices, indices, texture coordinates, dimesnion

	Graphics.prototype._drawTGS = function(vrt, ind, uvt, d)
	{
		this._lsegment = null;
		var vnum = Math.floor(vrt.length/d);
		var tnum = Math.floor(ind.length/3)

		var key = vnum + "-" + tnum;
		var t;

		// any triangles to recycle?
		var trgs = this._dtgs[key];

		if(trgs && trgs.length > 0)	t = trgs.pop();
		else 						t = new UTgs(vnum, tnum);

		var j = 0;
		if(d==2)
			for(var i=0; i<vrt.length; i+=2)
			{
				var x = vrt[i];  var y = vrt[i+1];
				t.vrt[j++] = x;  t.vrt[j++] = y;  j++;
				this._updateBounds(x, y);
			}
		if(d==3)
			for(var i=0; i<vrt.length; i+=3)
			{
				var x = vrt[i];  var y = vrt[i+1];  var z = vrt[i+2];
				t.vrt[j++] = x;  t.vrt[j++] = y;  t.vrt[j++] = z;
				this._updateBounds(x, y);
			}

		if(this._ftype == 1)
		{
			if(uvt != null) for(var i=0; i<uvt.length; i++ )  t.uvt[i] = uvt[i];
			else t.emptyUVT = true;
			t.dirtyUVT = true;
		}

		for(var i=0; i<ind.length; i++) t.ind[i] = ind[i];

		if(this._ftype == 1) {t.useTex = true;  t._bdata = this._bdata; 		 }
		else				 {t.useTex = false; t.SetColor(this._cfstyle.colARR);}
		t.updateData();

		this._tgs.push(t);
		this._elems.push(t);
		this._empty = false;
	}

	/**
	 * Clears all the graphic content
	 */
	Graphics.prototype.clear = function()
	{
		this._duls	= this._uls;
		this._dcvs	= this._cvs;

		for(var i=0; i<this._tgs.length; i++)
		{
			var t = this._tgs[i];
			if(this._dtgs[t.key] == null) this._dtgs[t.key] = [];
			this._dtgs[t.key].push(t);
		}

		this._uls	= [];
		this._cvs	= [];
		this._tgs	= [];
		this._elems	= [];

		this._ftype	= 0;
		this._empty	= true;

		this._minx	= this._sminx = this._miny	= this._sminy = Number.POSITIVE_INFINITY;
		this._maxx	= this._smaxx = this._maxy	= this._smaxy = Number.NEGATIVE_INFINITY;

		this._lused = 0;
		this._lsegment = null;
	}

		/**
		 * Returns a bounding rectangle of a vector content
		 * @return	a bounding rectangle
		 */

	Graphics.prototype._getRect = function(stks)
	{
		if(this._empty) return null;
		var anyt = this._tgs.length != 0;
		var anys = (this._uls.length != 0 || this._cvs.length != 0);
		if(!stks && !anyt) return null;

		var b = this._brect;

		var sminx = this._sminx, sminy = this._sminy, smaxx = this._smaxx, smaxy = this._smaxy;
		if(anyt)
		{
			b._setP(this._minx, this._miny);
			b._unionWP(this._maxx, this._maxy);
			if(anys && stks) {b._unionWP(sminx, sminy); b._unionWP(smaxx, smaxy);}
			return b;
		}
		b._setP(sminx, sminy);
		b._unionWP(smaxx, smaxy);
		return b;
	}

	Graphics.prototype._hits = function(x, y)
	{
		if(this._empty) return false;
		if (x<this._minx || x > this._maxx || y < this._miny || y > this._maxy) return false;
		return true;
		/*
		var tnum = this._tgs.length;
		if(tnum == 1) return true;
		for(var i=0; i<tnum; i++) if(this._tgs[i]._hits(x,y)) return true;
		return false;
		*/
	}

	Graphics.prototype._updateBounds = function(x, y)
	{
		x<this._minx ? this._minx=x : (x>this._maxx ? this._maxx=x:0);	// evil code
		y<this._miny ? this._miny=y : (y>this._maxy ? this._maxy=y:0);	// evil code
	}

	Graphics.prototype._updateSBounds = function(x, y)
	{
		x<this._sminx ? this._sminx=x : (x>this._smaxx ? this._smaxx=x:0);	// evil code
		y<this._sminy ? this._sminy=y : (y>this._smaxy ? this._smaxy=y:0);	// evil code
	}

	Graphics._makeConvexInd = function(n)
	{
		var arr = [];
		for(var i=1; i<n-1; i++) arr.push(0, i, i+1);
		return arr;
	}

	Graphics._rVrt = [0,0, 0,0, 0,0, 0,0];
	Graphics._rInd = [0,1,2, 1,2,3];

	Graphics._eVrt = [];  for(var i=0; i<32; i++) Graphics._eVrt.push(0,0);
	Graphics._eInd = Graphics._makeConvexInd(32);

	Graphics._rrVrt= [];  for(var i=0; i<32; i++) Graphics._rrVrt.push(0,0);
	Graphics._rrInd = Graphics._makeConvexInd(32);

	/**
		Universal line segment.
	*/

	function ULSegment(off, c, vb)
	{
		this.vbuf	= vb;
		this.offset	= 0;
		this.count	= 0;
		this.color	= new Float32Array(4);
		this.update(off, c);
	}

	ULSegment.prototype.update = function(off, col)
	{
		this.count = 0;
		this.offset = off;
		var c = this.color;
		c[0]=col[0]; c[1]=col[1]; c[2]=col[2]; c[3]=col[3];
	}

	ULSegment.prototype.render = function(st)
	{
		Stage._setUT(0);
		//gl.uniform1i (st._sprg.useTex, 0);
		gl.uniform4fv(st._sprg.color, this.color);

		Stage._setVC(this.vbuf);
		Stage._setTC(this.vbuf);

		gl.drawArrays(gl.TRIANGLES, 6*this.offset, 6*this.count);
	}


	/**
	 * A class for internal representation of a Triangle soup
	 */

	function UTgs(vnum, tnum)	// number of vertices, number of triangles
	{
		// Key:  NUM_OF_VERTICES-NUM_OF_TRIANGLES
		this.key = vnum + "-" + tnum;
		this.vrt = new Float32Array(3*vnum);
		this.ind = new Uint16Array(3*tnum);
		this.uvt = new Float32Array(2*vnum);

		this.useTex = false;
		this.dirtyUVT = false;	// UVT needs to be edited / scaled
		this.emptyUVT = false;	// drawing with texture & no UVT					- need to fill UVT
		this.color = new Float32Array(4);
		this._bdata = null;

		this.vbuf = gl.createBuffer();
		Stage._setBF(this.vbuf);
		gl.bufferData(gl.ARRAY_BUFFER, this.vrt, gl.STATIC_DRAW);

		this.ibuf = gl.createBuffer();
		Stage._setEBF(this.ibuf);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.ind, gl.STATIC_DRAW);

		this.tbuf = gl.createBuffer();
		Stage._setBF(this.tbuf);
		gl.bufferData(gl.ARRAY_BUFFER, this.uvt, gl.STATIC_DRAW);
	}
	UTgs.prototype.SetColor = function(col)
	{
		var c = this.color; c[0]=col[0]; c[1]=col[1]; c[2]=col[2]; c[3]=col[3];
	}
	UTgs.prototype._hits = function(x, y)
	{
		return (x>this._minx && x < this._maxx && y>this._miny && y< this._maxy);
	}

	UTgs.prototype.updateData = function()
	{
		Stage._setBF(this.vbuf);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vrt);

		Stage._setEBF(this.ibuf);
		gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, this.ind);

		Stage._setBF(this.tbuf);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.uvt);
	}

	UTgs.prototype.render = function(st)
	{
		//return;
		if(this.useTex)
		{
			var bd = this._bdata;
			if(bd._loaded == false) return;
			if(this.dirtyUVT)
			{
				this.dirtyUVT = false;
				if(this.emptyUVT)
				{
					this.emptyUVT = false;
					var cw = 1/bd._rwidth, ch = 1/bd._rheight;
					for(var i=0; i<this.uvt.length; i++) {this.uvt[2*i] = cw*this.vrt[3*i]; this.uvt[2*i+1] = ch*this.vrt[3*i+1];}
				}
				else if(bd.width != bd._rwidth || bd.height != bd._rheight)
				{
					var cw = bd.width/bd._rwidth, ch = bd.height/bd._rheight;
					for(var i=0; i<this.uvt.length; i++) {this.uvt[2*i] *= cw; this.uvt[2*i+1] *= ch; }
				}
				this.updateData();
			}
			Stage._setUT(1);
			Stage._setTEX(bd._texture);

		}
		else
		{
			Stage._setUT(0);
			gl.uniform4fv(st._sprg.color, this.color);
		}

		Stage._setTC(this.tbuf);
		Stage._setVC(this.vbuf);
		Stage._setEBF(this.ibuf);

		gl.drawElements(gl.TRIANGLES, this.ind.length, gl.UNSIGNED_SHORT, 0);	// druhý parametr - poèet indexù

	}
	UTgs.prototype.clear = function()
	{
		gl.deleteBuffer(this.vbuf);
		gl.deleteBuffer(this.ibuf);
		gl.deleteBuffer(this.tbuf);
	}

	/**
	 * A class for internal representation of a fill style
	 */
	function FillStyle(c, a)
	{
		this.color = 0x000000;
		this.alpha = 1.0;
		this.colARR = new Float32Array(4);
		this.Set(c, a);
	}
	FillStyle.prototype.Set = function(c, a)
	{
		this.color = c;
		this.alpha = a;
		var col = this.colARR;
		col[0] = (c>>16 & 255)*0.0039215686;
		col[1] = (c>>8 & 255)*0.0039215686;
		col[2] = (c & 255)*0.0039215686;
		col[3] = a;
	}

	/**
	 * A class for internal representation of a line style
	 */
	function LineStyle(th, c, a)
	{
		FillStyle.call(this);
		this.color = c;
		this.alpha = a;
		this.thickness = th;
		this.Set(th, c, a);
	}
	LineStyle.prototype = new FillStyle();

	LineStyle.prototype.Set = function(th, c, a)
	{
		this.thickness = th;
		FillStyle.prototype.Set.call(this, c, a);
	}


	function Sprite()
	{
		DisplayObjectContainer.call(this);

		this.graphics = new Graphics();
	}
	Sprite.prototype = new DisplayObjectContainer();


	Sprite.prototype._render = function(st)
	{
		if(!this.graphics._empty) this.graphics._render(st);
		DisplayObjectContainer.prototype._render.call(this, st);
	}

	Sprite.prototype._moveMouse = function(nx, ny, chColl)
	{
		if(!chColl || !this.visible || (!this.mouseChildren && !this.mouseEnabled)) return null;

		var tgt = DisplayObjectContainer.prototype._moveMouse.call(this, nx, ny, chColl);
		if(tgt != null) return tgt;

		if(!this.mouseEnabled) return null;
		var t = this._temp;
		if(this.graphics._hits(t[0], t[1])) return this;
		return null;
	}

	Sprite.prototype._getRect = function(stks)
	{
		var r;
		var r1 = DisplayObjectContainer.prototype._getRect.call(this, stks);
		var r2 = this.graphics._getRect(stks);

		if(r1 != null && r2 != null) r1._unionWith(r2);
		if(r1 != null) r = r1; else r = r2;
		return r;
	}

	Sprite.prototype._htpLocal = function(pt)
	{
		var t = this._temp;
		Point._m4.multiplyVec2(this._getIMat(), pt, t);
		if(this.graphics._hits(t[0], t[1])) return true;
		return DisplayObjectContainer.prototype._htpLocal.call(this, pt);
	}
	var TextFormatAlign =
	{
		LEFT	: "left",
		CENTER	: "center",
		RIGHT	: "right",
		JUSTIFY	: "justify"
	}
			/**
		 * A constructor of text format
		 * @param f		URL of font
		 * @param s		size of text
		 * @param c		color of text
		 */
	function TextFormat(f, s, c, b, i, a, l)
	{
		/* public */
		this.font	= f?f:"Times new Roman";
		this.size	= s?s:12;
		this.color	= c?c:0x000000;
		this.bold	= b?b:false;
		this.italic	= i?i:false;
		this.align	= a?a:TextFormatAlign.LEFT;
		this.leading= l?l:0;

		this.maxW = 0;
		this.data = {image:null, tw:0, th:0, rw:0, rh:0};	// image, text width/height, real width/height
	}

	TextFormat.prototype.clone = function()
	{
		return (new TextFormat(this.font, this.size, this.color, this.bold, this.italic, this.align, this.leading));
	}

	TextFormat.prototype.set = function(tf)
	{
		this.font = tf.font;
		this.size = tf.size;
		this.color = tf.color;
		this.bold = tf.bold;
		this.italic = tf.italic;
		this.align = tf.align;
		this.leading = tf.leading;
	}

	TextFormat.prototype.getImageData = function(s, tf)	// string, TextField - read only
	{
		var canv = TextFormat._canvas;
		var cont = TextFormat._context;
		var data = this.data;

		canv.width	= data.rw = this._nhpt(tf._areaW); //console.log(tf._areaW, canv.width);
		canv.height	= data.rh = this._nhpt(tf._areaH); //console.log(tf._areaH, canv.height);

		var c = this.color;
		var r = (c>>16 & 0x0000ff);
		var g = (c>>8 & 0x0000ff);
		var b = (c & 0x0000ff);

		cont.textBaseline = "top";
		cont.fillStyle = "rgb("+r+","+g+","+b+")";
		cont.font = (this.italic?"italic ":"")+(this.bold?"bold ":"")+this.size+"px "+this.font;

		this.maxW = 0;
		var pars = s.split("\n");
		var line = 0;
		var posY = 0;
		var lineH = this.size * 1.25;
		for(var i=0; i<pars.length; i++)
		{
			var lc = this.renderPar(pars[i], posY, lineH, cont, tf);
			line += lc;
			posY += lc *(lineH +this.leading);
		}
		if(this.align == TextFormatAlign.JUSTIFY) this.maxW = Math.max(this.maxW, tf._areaW);

		data.image = canv;
		data.tw = this.maxW;
		data.th = (lineH+this.leading)*line - this.leading;
		return data;
	}

	TextFormat.prototype.renderPar = function(s, posY, lineH, cont, tf)	// returns number of lines
	{
		var words;
		if(tf._wordWrap) words = s.split(" ");
		else words = [s];

		var spacew = cont.measureText(" ").width;
		var curlw = 0;			// current line width
		var maxlw = tf._areaW;	// maximum line width
		var cl = 0;				// current line

		var lines = [[]];		// array of lines , line = (arrays of words)
		var lspace = [];		// free line space

		for(var i=0; i<words.length; i++)
		{
			var word = words[i];
			var ww = cont.measureText(word).width;
			if(curlw + ww <= maxlw || curlw == 0)
			{
				lines[cl].push(word);
				curlw += ww + spacew;
			}
			else
			{
				lspace.push(maxlw - curlw + spacew);
				lines.push([]);
				cl++;
				curlw = 0;
				i--;
			}
		}
		lspace.push(maxlw - curlw + spacew);

		for(var i=0; i<lines.length; i++)
		{
			var line = lines[i];
			while(line[line.length-1] == "") {line.pop(); lspace[i] += spacew; }
			this.maxW = Math.max(this.maxW, maxlw-lspace[i]);

			var gap, lineY = posY + (lineH+this.leading)*i;
			curlw = 0, gap = spacew;
			if(this.align == TextFormatAlign.CENTER ) curlw = lspace[i]*0.5;
			if(this.align == TextFormatAlign.RIGHT  ) curlw = lspace[i];
			if(this.align == TextFormatAlign.JUSTIFY) gap = spacew+lspace[i]/(line.length-1);

			for(var j=0; j<line.length; j++)
			{
				var word = line[j];
				cont.fillText(word, curlw, lineY);
				var ww = cont.measureText(word).width;
				if(i < lines.length-1) curlw += ww + gap;	// not last line
				else {curlw += ww + spacew;}				// last line
			}
		}
		return cl+1;
	}

	TextFormat.prototype._nhpt = function(x)
	{
		--x;
		for (var i = 1; i < 32; i <<= 1) x = x | x >> i;
		return x + 1;
	}

	TextFormat._canvas = document.createElement("canvas");
	TextFormat._context = TextFormat._canvas.getContext("2d");

		/**
		 * Set the text format of a text
		 * @param ntf	new text format
		 */
	function TextField()
	{
		InteractiveObject.call(this);


		this._wordWrap	= false;	// wrap words
		this._textW		= 0;		// width of text
		this._textH		= 0;		// height of text
		this._areaW		= 100;		// width of whole TF area
		this._areaH		= 100;		// height of whole TF area
		this._text		= "";		// current text
		this._tForm		= new TextFormat();
		this._rwidth	= 0;
		this._rheight	= 0;

		this._texture	= gl.createTexture();	// texture
		this._tcArray	= new Float32Array([0,0, 0,0, 0,0, 0,0]);
		this._tcBuffer	= gl.createBuffer();	// texture coordinates buffer
		Stage._setBF(this._tcBuffer);
		//gl.bindBuffer(gl.ARRAY_BUFFER, this._tcBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this._tcArray, gl.STATIC_DRAW);

		this._fArray	= new Float32Array([0,0,0, 0,0,0, 0,0,0, 0,0,0]);
		this._vBuffer	= gl.createBuffer();	// vertices buffer for 4 vertices
		Stage._setBF(this._vBuffer);
		//gl.bindBuffer(gl.ARRAY_BUFFER, this._vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this._fArray, gl.STATIC_DRAW);

		this._brect.x = this._brect.y = 0;
	}
	TextField.prototype = new InteractiveObject();

	/* public */

	TextField.prototype.setTextFormat = function(ntf)
	{
		this._tForm.set(ntf);
		this._update();
	}

	TextField.prototype.getTextFormat = function(ntf)
	{
		return this._tForm.clone();
	}

	TextField.prototype._update = function()
	{
		var w = this._brect.width  = this._areaW;
		var h = this._brect.height = this._areaH;

		if(w == 0 || h == 0) return;
		var data = this._tForm.getImageData(this._text, this);
		this._textW = data.tw;
		this._textH = data.th;

		if(data.rw != this._rwidth || data.rh != this._rheight)
		{
			gl.deleteTexture(this._texture);
			this._texture = gl.createTexture();
		}
		Stage._setTEX(this._texture);
		//gl.bindTexture(gl.TEXTURE_2D, this._texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);

		this._rwidth = data.rw;
		this._rheight = data.rh;

		var sx = w / data.rw;
		var sy = h / data.rh;

		var ta = this._tcArray;
		ta[2] = ta[6] = sx;
		ta[5] = ta[7] = sy;

		Stage._setBF(this._tcBuffer);
		//gl.bindBuffer(gl.ARRAY_BUFFER, this._tcBuffer);
		gl.vertexAttribPointer(Stage._main._sprg.tca, 2, gl.FLOAT, false, 0, 0);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, ta);

		var fa = this._fArray;
		fa[3] = fa[9] = w;
		fa[7] = fa[10] = h;
		Stage._setBF(this._vBuffer);
		//gl.bindBuffer(gl.ARRAY_BUFFER, this._vBuffer);
		gl.vertexAttribPointer(Stage._main._sprg.vpa, 3, gl.FLOAT, false, 0, 0);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, fa);
	}

	TextField.prototype._render = function(st)
	{
		if(this._areaW == 0 || this._areaH == 0) return;

		gl.uniformMatrix4fv(st._sprg.tMatUniform, false, st._mstack.top());
		st._cmstack.update();

		Stage._setVC(this._vBuffer);
		Stage._setTC(this._tcBuffer);
		Stage._setUT(1);
		Stage._setTEX(this._texture);
		Stage._setEBF(st._unitIBuffer);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	}

	this.tp = TextField.prototype;
	tp.ds = tp.__defineSetter__;
	tp.dg = tp.__defineGetter__;

	tp.dg("textWidth" , function(){return this._textW;});
	tp.dg("textHeight", function(){return this._textH;});

	tp.ds("wordWrap", function(x){this._wordWrap = x; this._update();});
	tp.dg("wordWrap", function( ){return this._wordWrap;});

	tp.ds("width" , function(x){this._areaW = Math.max(0,x); this._update();});
	tp.dg("width" , function( ){return this._areaW;});

	tp.ds("height", function(x){this._areaH = Math.max(0,x);; this._update();});
	tp.dg("height", function( ){return this._areaH;});

	tp.ds("text", function(x){this._text = x.toString(); this._update();});
	tp.dg("text", function( ){return this._text;});

	delete(tp.ds);
	delete(tp.dg);
	delete(this.tp);


