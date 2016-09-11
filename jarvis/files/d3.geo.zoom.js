// Copyright (c) 2013, Jason Davies, http://www.jasondavies.com
// See LICENSE.txt for details.
(function() {
/* global d3 */
var radians = Math.PI / 180,
    degrees = 180 / Math.PI;

// TODO make incremental rotate optional

d3.geo.zoom = function() {
  var projection,
      zoomPoint,
      event = d3.dispatch('zoomstart', 'zoom', 'zoomend'),
      zoom = d3.behavior.zoom()
        .on('zoomstart', function() {
          var mouse0 = d3.mouse(this),
              rotate = quaternionFromEuler(projection.rotate()),
              point = position(projection, mouse0);
          if (point) {
            zoomPoint = point;
          }

          zoomOn.call(zoom, 'zoom', function() {
                projection.scale(d3.event.scale);
                var mouse1 = d3.mouse(this),
                    between = rotateBetween(zoomPoint, position(projection, mouse1));
                projection.rotate(eulerFromQuaternion(rotate = between
                    ? multiply(rotate, between)
                    : multiply(bank(projection, mouse0, mouse1), rotate)));
                mouse0 = mouse1;
                event.zoom.apply(this, arguments);
              });
          event.zoomstart.apply(this, arguments);
        })
        .on('zoomend', function() {
          zoomOn.call(zoom, 'zoom', null);
          event.zoomend.apply(this, arguments);
        }),
      zoomOn = zoom.on;

  zoom.projection = function(_) {
    return arguments.length ? zoom.scale((projection = _).scale()) : projection;
  };

  return d3.rebind(zoom, event, 'on');
};

function bank(projection, p0, p1) {
  var t = projection.translate(),
      angle = Math.atan2(p0[1] - t[1], p0[0] - t[0]) - Math.atan2(p1[1] - t[1], p1[0] - t[0]);
  return [Math.cos(angle / 2), 0, 0, Math.sin(angle / 2)];
}

function position(projection, point) {
  var t = projection.translate(),
      spherical = projection.invert(point);
  return spherical && isFinite(spherical[0]) && isFinite(spherical[1]) && cartesian(spherical);
}

function quaternionFromEuler(euler) {
  var i1 = 0.5 * euler[0] * radians,
      i2 = 0.5 * euler[1] * radians,
      i3 = 0.5 * euler[2] * radians,
      sini1 = Math.sin(i1), cosi1 = Math.cos(i1),
      sini2 = Math.sin(i2), cosi2 = Math.cos(i2),
      sini3 = Math.sin(i3), cosi3 = Math.cos(i3);
  return [
    cosi1 * cosi2 * cosi3 + sini1 * sini2 * sini3,
    sini1 * cosi2 * cosi3 - cosi1 * sini2 * sini3,
    cosi1 * sini2 * cosi3 + sini1 * cosi2 * sini3,
    cosi1 * cosi2 * sini3 - sini1 * sini2 * cosi3
  ];
}

function multiply(a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
      b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  return [
    a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3,
    a0 * b1 + a1 * b0 + a2 * b3 - a3 * b2,
    a0 * b2 - a1 * b3 + a2 * b0 + a3 * b1,
    a0 * b3 + a1 * b2 - a2 * b1 + a3 * b0
  ];
}

function rotateBetween(a, b) {
  if (!a || !b) {
    return;
  }
  var axis = cross(a, b),
      norm = Math.sqrt(dot(axis, axis)),
      halfi3 = 0.5 * Math.acos(Math.max(-1, Math.min(1, dot(a, b)))),
      k = Math.sin(halfi3) / norm;
  return norm && [Math.cos(halfi3), axis[2] * k, -axis[1] * k, axis[0] * k];
}

function eulerFromQuaternion(q) {
  return [
    Math.atan2(2 * (q[0] * q[1] + q[2] * q[3]), 1 - 2 * (q[1] * q[1] + q[2] * q[2])) * degrees,
    Math.asin(Math.max(-1, Math.min(1, 2 * (q[0] * q[2] - q[3] * q[1])))) * degrees,
    Math.atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] * q[2] + q[3] * q[3])) * degrees
  ];
}

function cartesian(spherical) {
  var i1 = spherical[0] * radians,
      i2 = spherical[1] * radians,
      cosi2 = Math.cos(i2);
  return [
    cosi2 * Math.cos(i1),
    cosi2 * Math.sin(i1),
    Math.sin(i2)
  ];
}

function dot(a, b) {
  for (var i = 0, n = a.length, s = 0; i < n; ++i) {
    s += a[i] * b[i];
  }
  return s;
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

})();