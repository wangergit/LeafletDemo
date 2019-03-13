//全局变量
var map = null
var printer = null
var config = {}

/**
 * 初始化地图组件
 * @param {json} data 
 */
function initMap(data){
    config = data
    
}

function getConfig (){
    sendAjax("config/config.json","GET",initMap)
}

/**
 * 请求JSON数据
 * @param path  请求路径   String
 * @param type  请求类型   "GET"/"POST"
 * @param callback  function
 */
function sendAjax(path , type , callback){
	$.ajax({
		type : type,
		url : path,
		dataType : "json",
		contentType:"application/json;charset=utf-8",
		success : function(result) {
			if(callback){callback(result)}
		},
		error : function(result){
			if(callback){callback("error")}
		}
	})
}

/**
 * 底图快捷切换工具
 */
function basemapsControl(){
    L.control.basemaps({
        basemaps: basemaps,
        tileX: 0,
        tileY: 0,
        tileZ: 1
    }).addTo(map)
}

/**
 * 比例尺
 */
function scaleControl(){
    L.control.scale({imperial : false , position : 'bottomleft'}).addTo(map)
}

/**
 * 平移
 */
function panControl(){
    L.control.pan().addTo(map)
}

/**
 * 缩放
 */
function zoomControl(){
    L.control.zoom().addTo(map)
}

/**
 * 漫游记忆
 */
function navbarControl(){
    L.control.navbar().addTo(map)
}

/**
 * 鼠标信息
 */
function mousePositioControl(){
    L.control.mousePosition({
        lngFirst : true
    }).addTo(map)
}

/**
 * 打印
 */
function printerControl(){
    printer = L.easyPrint({
        tileLayer: tiledLayer,
        sizeModes: ['Current', 'A4Landscape', 'A4Portrait'],
        filename: 'map',
        exportOnly: true,
        hideControlContainer: true
    }).addTo(map)
}

/**
 * 执行打印
 */
function manualPrint() {
    printer.printMap('CurrentSize', 'MyManualPrint')
}

/**
 * 属性信息
 */
function attributionControl(){
    L.control.attribution({
        "prefix" : "<a href='" + config.attribution.link + "' title='" + config.attribution.title + "' target='_blank'>" + config.attribution.name + "</a>"
    }).addTo(map)
}

/**
 * 鹰眼图
 */
function miniMapControl() {
    var miniMap = new L.Control.MiniMap(osm, { toggleDisplay: true }).addTo(map)
    /*var miniMap = new L.Control.MiniMap(osm, { toggleDisplay: true }).addTo(map);
    miniMap.on("toggle", function(data) {
    });
    miniMap.on("minimize", function() {
    });
    miniMap.on("restore", function() {
    });

    var actionButton = new (L.Control.extend({
        options: {
            position: 'topleft',
            html: "#",
            toggleClass: "toggle",
            status: false,
            listeners: []
        },
        initialize: function (options) {
            L.setOptions(this, options);
            this._status = this.options.status;
        },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'leaflet-control-actionbtn leaflet-bar leaflet-control');
            var link = this._link = L.DomUtil.create('a', '', container);
            link.href = '#';
            link.innerHTML = this.options.html;
            link.title = this.options.title || this.options.html;
            L.DomEvent.on(link, 'click', this._onBtnClick, this);
            if (this.options.status) {
                this._toggle();
            }
            this._addListeners();
            return container;
        },

        toggle: function () {
            this._toggle();
            if (this.options.action) {
                this._removeListeners();
                this._forListeners(null, function (listener) {
                    listener[0].once(listener[1], this._addListeners, this);
                });
                this.options.action.call(this, this._status);
            }
        },

        _toggle: function () {
            this._status = !this._status;
            if (!this._status) {
                L.DomUtil.addClass(this._link, this.options.toggleClass);
            } else {
                L.DomUtil.removeClass(this._link, this.options.toggleClass);
            }
        },

        _addListeners: function () {
            this._forListeners();
        },

        _removeListeners: function () {
            this._forListeners(true);
        },

        _forListeners: function (off, func) {
            if (this.options.listeners.length) {
                for (var fry = 0; fry < this.options.listeners.length; fry++) {
                    var listener = this.options.listeners[fry];
                    var action = listener[0] && listener[0][off ? "off" : "on"];
                    if (action && typeof listener[1] === 'string') {
                        if (func) {
                            func.call(this, listener);
                        } else {
                            action.call(listener[0], listener[1], this._toggle, this);
                        }
                    }
                }
            }
        },

        _onBtnClick: function (e) {
            L.DomEvent.stop(e);
            this.toggle();
        }
    }))({
        action: function() { miniMap._toggleDisplayButtonClicked(); },
        status: !miniMap._minimized,
        html: "鹰眼",
        listeners: [[miniMap, "toggle"]]
    });
    actionButton.addTo(map);*/
}

/**
 * 放大镜
 */
function magnifyingGlassControl() {
    L.Control.MagnifyingGlass = L.Control.extend({
        _magnifyingGlass: false,
        options: {
            position: 'topleft',
            title: '放大镜',
            forceSeparateButton: false
        },
        initialize: function (magnifyingGlass, options) {
            this._magnifyingGlass = magnifyingGlass
            for (var i in options) if (options.hasOwnProperty(i) && this.options.hasOwnProperty(i)) this.options[i] = options[i]
        },
        onAdd: function (map) {
            var className = 'leaflet-control-magnifying-glass', container
            if (map.zoomControl && !this.options.forceSeparateButton) container = map.zoomControl._container
            else container = L.DomUtil.create('div', 'leaflet-bar')
            this._createButton(this.options.title, className, container, this._clicked, map, this._magnifyingGlass)
            return container
        },
        _createButton: function (title, className, container, method, map, magnifyingGlass) {
            var link = L.DomUtil.create('a', className, container)
            link.href = '#'
            link.title = title
            L.DomEvent
            .addListener(link, 'click', L.DomEvent.stopPropagation)
            .addListener(link, 'click', L.DomEvent.preventDefault)
            .addListener(link, 'click', function() {method(map, magnifyingGlass);}, map)
            return link
        },
        _clicked: function (map, magnifyingGlass) {
            if (!magnifyingGlass) return
            if (map.hasLayer(magnifyingGlass)) map.removeLayer(magnifyingGlass)
            else magnifyingGlass.addTo(map)
        }
    })
    
    L.control.magnifyingglass = function (magnifyingGlass, options) {
        return new L.Control.MagnifyingGlass(magnifyingGlass, options)
    }
    var magnifyingGlass = L.magnifyingGlass({
        zoomOffset: 3,
        layers: [
            tiledLayer
        ]
    })
    L.control.magnifyingglass(magnifyingGlass, {
        forceSeparateButton: true
    }).addTo(map)
}

/**
 * 图层检索要素
 */
function searchControl(){
    var geojsonOpts = {
        pointToLayer: function(feature, latlng) {
            var myIcon = L.icon({
                iconUrl: 'http://localhost/webgis/images/custom-icon.png',
                iconSize : [20, 20]
            })
            return L.marker(latlng, {
                icon : myIcon
            }).bindPopup(feature.properties.amenity+'<br><b>'+feature.properties.name+'</b>')
        }
    }
    var poiLayers = L.layerGroup([
        L.geoJson(bar, geojsonOpts),
        L.geoJson(pharmacy, geojsonOpts),
        L.geoJson(restaurant, geojsonOpts)
    ])
    L.control.search({
        layer: poiLayers,
        initial: false,
        propertyName: 'name',
        buildTip: function(text, val) {
            var type = val.layer.feature.properties.amenity
            return '<a href="#" class="'+type+'">'+text+'<b>'+type+'</b></a>'
        }
    }).addTo(map)
}

function layersListControl(){
    var geojsonOpts = {
        pointToLayer: function(feature, latlng) {
            var myIcon = L.icon({
                iconUrl: 'http://localhost/webgis/images/custom-icon.png',
                iconSize : [20, 20]
            })
            return L.marker(latlng, {
                icon : myIcon
            }).bindPopup(feature.properties.amenity+'<br><b>'+feature.properties.name+'</b>')
        }
    }
    var overlayMaps = { 
		"Cities": L.geoJson(bar, geojsonOpts),
		"Cities1": L.geoJson(pharmacy, geojsonOpts),
		"Cities2": L.geoJson(restaurant, geojsonOpts)
    }
    var base1 = L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
        attribution: '',
        subdomains: 'abcd',
        maxZoom: 20,
        minZoom: 0,
        label: 'Toner',
        iconURL : 'http://localhost/LeafletDemo/LeafletDemo/images/0.jpg'
    })
    var base2 = L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png', {
        attribution: '',
        subdomains: 'abcd',
        maxZoom: 16,
        minZoom: 1,
        label: 'Watercolor',
        iconURL : 'http://localhost/LeafletDemo/LeafletDemo/images/0.png'
    })
    var baseMaps = { 
        "<span style='color: gray'>Grayscale</span>": base1,
        "Streets": base2 
    }
    L.control.layers(baseMaps,overlayMaps).addTo(map)
}


getConfig()