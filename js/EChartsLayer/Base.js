/* Copyright© 2000 - 2019 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/
/**
 * @namespace L
 * @category BaseTypes Namespace
 */
/**
 * @namespace L.supermap
 * @category BaseTypes Namespace
 */
/**
 * SuperMap Leaflet基类
 * 定义命名空间
 * 提供公共模块
 */

L.supermap = L.supermap || {};
L.supermap.control = L.supermap.control || {};
L.supermap.widgets = L.supermap.widgets || {};

L.Control.Attribution.include({
    options: {
        position: 'bottomright',
        prefix: Attributions.Prefix
    }
});


function wrapToGeoJSON(objClassArray) {
    objClassArray.map((objClass) => {
        objClass.defaultFunction = objClass.prototype.toGeoJSON;
        objClass.include({
            toGeoJSON: function (precision) {
                return objClass.defaultFunction.call(this, precision || 10);
            }
        })
        return objClass;
    })
}

wrapToGeoJSON([L.Polyline, L.Polygon, L.Marker, L.CircleMarker, L.Circle, L.LayerGroup]);