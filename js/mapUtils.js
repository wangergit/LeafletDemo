/**
 *  *****地图组件实现类******
 *  add at 20190124 
 */
//mapstat.jsp
var map ; //地图组件
var copyright = null; // 版权链接信息
var mapHeight = $(window).height();
var currentCenter;// 位置临时变量
var leftButtonState = '';// 左键状态临时变量
var layerObj = {};// 所有图层对象
var elementListMap = [];// 项目MAP对象
var id2leafletid = [];// 项目JSON对象与MAP对象关系
// 绘图临时变量
var tmpPoint;
var tmpLine;
var tmpPolyLine;
var wayPolyLine;
var wayPolyLineData;
var wayPolygon;
var wayPolygonData;
var configId = 0;
var iconOption = {// 自定义标记图标
	iconUrl : 'static/gis/images/marker-icon.png',
	iconRetinaUrl : 'static/gis/images/marker-icon-2x.png',
	shadowUrl : 'static/gis/images/marker-shadow.png',
	shadowRetinaUrl : 'static/gis/images/marker-shadow.png',
	iconSize : [ 12, 16 ],
	iconAnchor : [ 6, 16 ],
	shadowSize : [ 16, 16 ],
	shadowAnchor : [ 6, 16 ],
	popupAnchor : [ 0, 0 ]
};
var favIconOption = {}, riskIconOption = {}, latentIconOption = {}, accidentIconOption = {}, itemIconOption = {}, itemDetailIconOption = {}, skyboxIconOption = {};//图标配置声明
var markerIcon = null; favIcon = null; riskIcon = null; latentIcon = null; accidentIcon = null; emergencyIcon = null; itemIcon = null; itemDetailIcon = null; skyboxIcon = null; // 图标变量声明
var shape; // 概览信息层
var previewLayer;// 绘图预览层
var ControlBar; // 工具条
var layerSetting = eval("(" + syscfgMap.mapLayerSetting + ")");//图层初始数据
if (layerSetting == undefined) {
	layerSetting = {
		"init" : [ 0, 1 ],
		"display" : [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
		"region" : "none"
	};
}
//map.jsp
var posAddr = {};
var geoJsonObj = {};
var loadCount = 0;
var mapNode = "";//地图组件引用类型记录

/**
 * 初始化函数 主接口  mapstat
 * @param result
 */
function loadControlMapStat(result) {
	mapNode = "mapStat";
	copyright = result.copyright;
	// 创建map对象 //$("#map").css({"min-height":mapHeight+'px'});
	map = L.map('map', {
		minZoom : 3,
		maxZoom : 17,
		measureControl : true,
		fullscreenControl : true,
		fullscreenControlOptions : {
			title : "全屏浏览",
			titleCancel : "退出全屏",
			position : 'topleft'
		}
	});
	// 初始化图标 初始化图标 初始化图标
	$.extend(favIconOption, iconOption);
	$.extend(riskIconOption, iconOption);
	$.extend(latentIconOption, iconOption);
	$.extend(accidentIconOption, iconOption);
	$.extend(itemIconOption, iconOption);
	$.extend(itemDetailIconOption, iconOption);
	$.extend(skyboxIconOption, iconOption);
	// 兴趣点ICON
	favIconOption.iconUrl = 'static/gis/images/fav-icon.png';
	favIconOption.iconRetinaUrl = 'static/gis/images/fav-icon-2x.png';
	// 项目ICON
	riskIconOption.iconUrl = 'static/gis/images/proj-icon0.png';
	riskIconOption.iconRetinaUrl = 'static/gis/images/proj-icon0-2x.png';
	latentIconOption.iconUrl = 'static/gis/images/proj-icon1.png';
	latentIconOption.iconRetinaUrl = 'static/gis/images/proj-icon1-2x.png';
	accidentIconOption.iconUrl = 'static/gis/images/proj-icon2.png';
	accidentIconOption.iconRetinaUrl = 'static/gis/images/proj-icon2-2x.png';
	itemIconOption.iconUrl = 'static/gis/images/proj-icon3.png';
	itemIconOption.iconRetinaUrl = 'static/gis/images/proj-icon3-2x.png';
	itemDetailIconOption.iconUrl = 'static/gis/images/proj-icon4.png';
	itemDetailIconOption.iconRetinaUrl = 'static/gis/images/proj-icon4-2x.png';
	skyboxIconOption.iconUrl = 'static/gis/images/skybox-icon.png';
	skyboxIconOption.iconRetinaUrl = 'static/gis/images/skybox-icon-2x.png';
	markerIcon = L.icon(iconOption);
	favIcon = L.icon(favIconOption);
	riskIcon = L.icon(riskIconOption);
	latentIcon = L.icon(latentIconOption);
	accidentIcon = L.icon(accidentIconOption);
	emergencyIcon = L.icon(favIconOption);
	itemIcon = L.icon(itemIconOption);
	itemDetailIcon = L.icon(itemDetailIconOption);
	skyboxIcon = L.icon(skyboxIconOption);
	// 初始化要素图层
	shape = new L.LayerGroup(); // 概览信息层
	previewLayer = new L.LayerGroup();// 绘图预览层
	map.addLayer(previewLayer);
	// 地图初始化试图
	map.setView([ centerPoint.latitude, centerPoint.longitude ], centerPoint.zoom);
	// 创建工具条
	L.control.attribution({
		"prefix" : "<a href='" + copyright.link + "' title='" + copyright.title + "' target='_blank'>" + copyright.name + "</a>"
	}).addTo(map);
	// 创建比例尺控件
	L.control.scale({
		imperial : false,
		position : 'bottomleft'
	}).addTo(map);
	ControlBar = L.Control.extend({
		initialize : function(foo, options) {
			L.Util.setOptions(this, options);
		},
		onAdd : function(map) {
			var container = L.DomUtil.create('div', 'mycontrol');
			return container;
		}
	});
	var layerBar = new ControlBar('layerBar', {
		position : 'topright'
	});
	var toolBar = new ControlBar('toolBar', {
		position : 'topright'
	});
	map.addControl(layerBar);
	map.addControl(toolBar);
	var layerDiv = layerBar.getContainer();
	layerDiv.className = layerDiv.className + " iconfont aj-tuceng";
	var toolDiv = toolBar.getContainer();
	toolDiv.className = toolDiv.className + " iconfont aj-bianji";
	// 图层控制元素
	var layerHtml = "<div class='mytoolbar toolbar1'>";
		layerHtml += "<i class='iconfont aj-jiantou' style='float:left;cursor:pointer;color:#c0c0c0'></i>";
		layerHtml += "<h5>图层控制</h5>";
		layerHtml += "<div id='layerTree' class='tree'></div>";
		layerHtml += "</div>";
	// 工具栏元素
	var toolHtml = "<div class='mytoolbar toolbar2'><h5>地图编辑</h5>";
		toolHtml += "<div class='external-event label-normal' code='tool_position'><i class='iconfont aj-dingwei'></i> 定位</div>";
		toolHtml += "<div class='external-event label-normal' code='tool_mark'><i class='iconfont aj-biaozhu'></i> 点标注</div>";
		toolHtml += "<div class='external-event label-normal' code='tool_way'><i class='iconfont aj-lujingfenxi'></i> 路径标注</div>";
		toolHtml += "<div class='external-event label-normal' code='tool_surface'><i class='iconfont aj-fanweibiaoji'></i> 范围标注</div>";
		toolHtml += "<div class='external-event label-normal' code='tool_input'><i class='iconfont aj-bianji'></i> 范围输入</div></div>";
	$(layerDiv).html(layerHtml);
	$(toolDiv).html(toolHtml);
	map.on('mouseout', function() {
		$('.aj-jiantou').click();
	});
	// 地图工具面板悬浮事件
	$(".toolbar2 .external-event").on("mouseover", function() {
		$(".toolbar2 .external-event").each(function() {
			if (!$(this).hasClass("label-normal")) {
				$(this).addClass("label-normal");
				$(this).children("i").removeClass("white");
				$(this).children("i").addClass("blue");
			}
		});
		$(this).removeClass("label-normal");
		$(this).children("i").removeClass("blue");
		$(this).children("i").addClass("white");
	});
	// 工具栏点击事件
	$(".toolbar2 .external-event").on("click", function() {
		var cmdstr = $(this).attr('code');
		map.removeEventListener('click');
		map.removeEventListener('mousemove');
		$('#map').css({
			'cursor' : 'default'
		});
		$('#posDiv').hide();
		if (cmdstr == 'tool_position') {// 定位
			$('#paramDiv').show();
			setDivCenter('#paramDiv');
		} else if (cmdstr == 'tool_mark') {// 点标注
			$('#map').css({
				'cursor' : 'crosshair'
			});
			$('.toolbar2').mouseout();
			leftButtonState = 'tool_mark';
			map.on('mousemove', function(e) {
				showLatlntDiv(e);
			});
			map.on('click', function(e) {
				var pointMark = new L.Marker(new L.latLng(e.latlng.lat, e.latlng.lng), {
					icon : markerIcon,
					zIndexOffset : 9999
				});
				shape.addLayer(pointMark);
				pointMark.on("click", function(e) {
					$('#config_name').val("");
					$('#config_id').val("");
					$('#config_project').val("");
					$('#config_type').val("500105");
					$('#config_coord').val("[[" + P6(this._latlng.lat) + "," + P6(this._latlng.lng) + "]]");
					showConfigDiv(e, this);
				});
			});
			return false;
		} else if (cmdstr == 'tool_way') {// 路径标注
			$('#map').css({
				'cursor' : 'pointer'
			});
			$('.toolbar2').mouseout();
			leftButtonState = 'tool_way';
			wayPolyLineData = [];
			map.on('mousemove', function(e) {
				showLatlntDiv(e);
				if (previewLayer.hasLayer(tmpPoint))
					previewLayer.removeLayer(tmpPoint);
				if (previewLayer.hasLayer(tmpLine))
					previewLayer.removeLayer(tmpLine);
				tmpPoint = new L.circle(e.latlng, 10, {
					color : "green",
					weight : 5,
					fill : true,
					fillColor : "blue"
				});
				if (wayPolyLineData.length > 0) {
					tmpLine = new L.polyline([ wayPolyLineData[wayPolyLineData.length - 1], e.latlng ], {
						color : 'green',
						weight : 1
					});
					previewLayer.addLayer(tmpLine);
				}
				previewLayer.addLayer(tmpPoint);
			});
			map.on('mousedown', function(e) {
				if (e.originalEvent.button != 0)
					return;
				previewLayer.clearLayers();
				if (wayPolyLineData.length > 1 && shape.hasLayer(wayPolyLine)) {
					shape.removeLayer(wayPolyLine);
				}
				wayPolyLineData.push(e.latlng);
				for (var i = 0; i < wayPolyLineData.length; i++) {
					previewLayer.addLayer(L.circle(wayPolyLineData[i], 10, {
						color : "green",
						weight : 5,
						fill : true,
						fillColor : "blue"
					}));
				}
				console.log(wayPolyLineData);
				if (wayPolyLineData.length > 1) {
					wayPolyLine = new L.polyline(wayPolyLineData, {
						color : "blue",
						weight : 2
					});
					shape.addLayer(wayPolyLine);
					console.log(wayPolyLine);
					wayPolyLine.on("click", function(e) {
						$('#config_id').val("");
						$('#config_name').val("");
						$('#config_project').val("");
						$('#config_type').val("500106");
						var tmpjsonStr = "[";
						for (var i = 0; i < wayPolyLineData.length; i++) {
							if (i > 0) {
								tmpjsonStr += ",";
							}
							tmpjsonStr += "[" + P6(wayPolyLineData[i].lat) + "," + P6(wayPolyLineData[i].lng) + "]";
						}
						tmpjsonStr += "]";
						$('#config_coord').val(tmpjsonStr);
						showConfigDiv(e, this);
					});
				}
			});
			return false;
		} else if (cmdstr == 'tool_surface') {// 范围标注
			$('#map').css({
				'cursor' : 'pointer'
			});
			$('.toolbar2').mouseout();
			leftButtonState = 'tool_surface';
			wayPolygonData = [];
			map.on('mousemove', function(e) {
				showLatlntDiv(e);
				if (previewLayer.hasLayer(tmpPoint))
					previewLayer.removeLayer(tmpPoint);
				if (previewLayer.hasLayer(tmpLine))
					previewLayer.removeLayer(tmpLine);
				tmpPoint = L.circle(e.latlng, 10, {
					color : "green",
					weight : 5,
					fill : true,
					fillColor : "blue"
				});
				if (wayPolygonData.length > 1) {
					tmpLine = L.polyline([ wayPolygonData[wayPolygonData.length - 1], e.latlng, wayPolygonData[0] ], {
						color : 'green',
						weight : 1
					});
					previewLayer.addLayer(tmpLine);
				} else if (wayPolygonData.length > 0) {
					tmpLine = L.polyline([ wayPolygonData[wayPolygonData.length - 1], e.latlng ], {
						color : 'green',
						weight : 1
					});
					previewLayer.addLayer(tmpLine);
				}
				previewLayer.addLayer(tmpPoint);
			});
			map.on('mousedown', function(e) {
				if (e.originalEvent.button != 0)
					return;
				previewLayer.clearLayers();
				if (wayPolygonData.length > 2 && shape.hasLayer(wayPolygon))
					shape.removeLayer(wayPolygon);
				if (shape.hasLayer(tmpPolyLine))
					shape.removeLayer(tmpPolyLine);
				wayPolygonData.push(e.latlng);
				for (var i = 0; i < wayPolygonData.length; i++) {
					previewLayer.addLayer(L.circle(wayPolygonData[i], 10, {
						color : "green",
						weight : 5,
						fill : true,
						fillColor : "blue"
					}));
				}
				if (wayPolygonData.length > 2) {
					wayPolygon = new L.Polygon(wayPolygonData, {
						color : "blue",
						weight : 2
					});
					shape.addLayer(wayPolygon);
					wayPolygon.on("click", function(e) {
						if (leftButtonState != "_startMeasure") {
							$('#config_id').val("");
							$('#config_name').val("");
							$('#config_project').val("");
							$('#config_type').val("500107");
							var tmpjsonStr = "[";
							for (var i = 0; i < wayPolygonData.length; i++) {
								if (i > 0)
									tmpjsonStr += ",";
								tmpjsonStr += "[" + P6(wayPolygonData[i].lat) + "," + P6(wayPolygonData[i].lng) + "]";
							}
							tmpjsonStr += "]";
							$('#config_coord').val(tmpjsonStr);
							showConfigDiv(e, this);
						} else {
							map.click();
						}
					});
				} else if (wayPolygonData.length > 1) {
					tmpPolyLine = new L.Polyline(wayPolygonData, {
						color : "blue",
						weight : 2
					});
					shape.addLayer(tmpPolyLine);
				}
			});
			return false;
		} else if (cmdstr == 'tool_input') {// 范围标注
			$('#map').css({
				'cursor' : 'pointer'
			});
			$('.toolbar2').mouseout();
			$('#pointsDiv').show();
			setDivCenter('#pointsDiv');
		}
	});
	// 保存标注属性
	$('#config_save').click(function() {
		var v_name = $('#config_name').val();
		var v_type = $('#config_type').val();
		var v_project = $('#config_project').val();
		var v_coord = $('#config_coord').val();
		var v_id = $('#config_id').val();
		var v_leaflet_id = $('#leaflet_id').val();
		if (v_id == "" || v_id == undefined) {
			v_id = configId;
			configId++;
		}
		id2leafletid.push([ v_id, v_leaflet_id ]);
		$('#configDiv').hide();
	});
	// 删除标注
	$('#config_hide').click(function() {
		var lid = $('#leaflet_id').val();
		var marr = shape.getLayers();
		for (var i = 0; i < marr.length; i++) {
			if (marr[i]._leaflet_id == lid) {
				shape.removeLayer(marr[i]);
				break;
			}
		}
		$('#configDiv').hide();
		$('.leaflet-popup').hide();
	});
	// 工具条动态展示
	$(layerDiv).on("mouseover", function() {
		$(this).removeClass("aj-tuceng");
		$('.toolbar1').show();
	});
	$(layerDiv).on("click", function() {
		$(this).removeClass("aj-tuceng");
		$('.toolbar1').show();
	});
	$(toolDiv).on("mouseover", function() {
		$('.aj-jiantou').click();
		$(this).removeClass("aj-bianji");
		$('.toolbar2').show();
	});
	$(toolDiv).on("click", function() {
		$(this).removeClass("aj-bianji");
		$('.toolbar2').show();
	});
	$(toolDiv).on("mouseout", function() {
		$(this).addClass("aj-bianji");
		$('.toolbar2').hide();
	});
	$('.aj-jiantou').on("click", function() {
		$(layerDiv).addClass("aj-tuceng");
		$('.toolbar1').hide();
		return false;
	});
	// 图层设置
	var layer_loadflag = 0;
	var layer_select = [];
	var layer_opacity = {};// 透明度
	var layerHtml = "<ul>";// 图层树元素拼接
		layerHtml += "<li " + getLayerStyle(0) + "><input type='checkbox' options='{opacity:1.0}' url='' code='layer_base_shape'/>概览信息<div code='layer_base_shape' class='layerop'><span></span></div></li>";
		layerHtml += "<li " + getLayerStyle(1) + "><input type='checkbox' options='{background:\"streetblue\",continuousWorld:true,minZoom:1,maxZoom:17,reuseTiles:true,opacity:1.0,API:\"\",desc:\"ESRI街道\"}' url='http://cache1.arcgisonline.cn/arcgis/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}' code='layer_tile_osmstreet'/>ESRI街道<div code='layer_tile_osmstreet' class='layerop'><span></span></div></li>";
		layerHtml += "<li " + getLayerStyle(2) + "><input type='checkbox' options='{background:\"\",continuousWorld:true,minZoom:1,maxZoom:17,reuseTiles:true,opacity:1.0,API:\"\",desc:\"卫星影像\",subdomains: [\"0\", \"1\", \"2\", \"3\", \"4\", \"5\", \"6\", \"7\"]}' url='http://t{s}.tianditu.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles' code='layer_tile_esrisat'/>卫星影像<div code='layer_tile_esrisat' class='layerop'><span></span></div></li>";
		layerHtml += "<li " + getLayerStyle(3) + "><input type='checkbox' options='{background:\"\",continuousWorld:true,minZoom:1,maxZoom:17,reuseTiles:true,opacity:1.0,API:\"\",desc:\"影像标注\",subdomains: [\"0\", \"1\", \"2\", \"3\", \"4\", \"5\", \"6\", \"7\"]}' url='http://t{s}.tianditu.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles' code='layer_tile_esristreet'/>影像标注<div code='layer_tile_esristreet' class='layerop'><span></span></div></li>";
		layerHtml += "<li " + getLayerStyle(4) + "><input type='checkbox' options='{background:\"\",continuousWorld:true,minZoom:1,maxZoom:17,reuseTiles:true,opacity:1.0,API:\"\",desc:\"行政区划\",subdomains: [\"0\", \"1\", \"2\", \"3\", \"4\", \"5\", \"6\", \"7\"]}' url='http://t{s}.tianditu.cn/ibo_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=ibo&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles' code='layer_tile_esristreetblue'/>行政区划<div code='layer_tile_esristreetblue' class='layerop'><span></span></div></li>";
		layerHtml += "<li " + getLayerStyle(5) + "><input type='checkbox' options='{background:\"\",continuousWorld:true,minZoom:1,maxZoom:17,reuseTiles:true,opacity:1.0,API:\"\",desc:\"矢量地图\",subdomains: [\"0\", \"1\", \"2\", \"3\", \"4\", \"5\", \"6\", \"7\"]}' url='http://t{s}.tianditu.cn/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles' code='layer_tile_spssarea'/>矢量地图<div code='layer_tile_spssarea' class='layerop'><span></span></div></li>";
		layerHtml += "<li " + getLayerStyle(6) + "><input type='checkbox' options='{background:\"\",continuousWorld:true,minZoom:1,maxZoom:17,reuseTiles:true,opacity:1.0,API:\"\",desc:\"矢量标记\",subdomains: [\"0\", \"1\", \"2\", \"3\", \"4\", \"5\", \"6\", \"7\"]}' url='http://t{s}.tianditu.cn/cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles' code='layer_tile_spssroad'/>矢量标记<div code='layer_tile_spssroad' class='layerop'><span></span></div></li>";
		layerHtml += "<li " + getLayerStyle(7) + "><input type='checkbox' options='{opacity:1.0}' url='/transport/riskregister/list.do?state=0&page=1&limit=1000&ssoid=" + ssoid + "' code='layer_public_mark_risk'/>重大风险<div code='layer_public_mark_risk' class='layerop'><span></span></div></li>";
		layerHtml += "<li " + getLayerStyle(8) + "><input type='checkbox' options='{opacity:1.0}' url='/transport/latentregister/unitRegisterList.do?state=0&page=1&limit=1000&ssoid=" + ssoid + "' code='layer_public_mark_latent'/>重大隐患<div code='layer_public_mark_latent' class='layerop'><span></span></div></li>";
		layerHtml += "<li " + getLayerStyle(9) + "><input type='checkbox' options='{opacity:1.0}' url='/construct/accident/accidentStatistics/totalData.do?state=0&page=1&limit=1000&ssoid=" + ssoid + "'  code='layer_public_mark_accident'/>事故黑点<div code='layer_public_mark_accident' class='layerop'><span></span></div></li>";
		layerHtml += "<li " + getLayerStyle(10) + "><input type='checkbox' options='{opacity:1.0}' url='/construct/build/fieldarea/queryItemAndDetail.do?ssoid=" + ssoid + "' code='layer_public_mark_item'/>项目信息<div code='layer_public_mark_item' class='layerop'><span></span></div></li>";
		layerHtml += "<li " + getLayerStyle(11) + "><input type='checkbox' options='{opacity:1.0}' url='/construct/build/emergencyrelmater/list.do?state=0&page=1&limit=1000&ssoid=" + ssoid + "' code='layer_public_mark_emergency'/>应急资源<div code='layer_public_mark_emergency' class='layerop'><span></span></div></li>";
		layerHtml += "<li " + getLayerStyle(12) + "><input type='checkbox' options='{opacity:1.0}' url='/construct/build/fieldarea/list.do?state=0&page=1&limit=1000&ssoid=" + ssoid + "' code='layer_public_field_area'/>现场区域<div code='layer_public_field_area' class='layerop'><span></span></div></li>";
		layerHtml += "<li " + getLayerStyle(13) + "><input type='checkbox' options='{opacity:1.0}' url='' code='layer_public_png_supvisor'/>安全热度<div code='layer_public_png_supvisor' class='layerop'><span></span></div></li>";
		layerHtml += "</ul>";
	$('#layerTree').html(layerHtml);
	$('#layerTree input').on('click', function(evt, data) {// 选中事件
		$(".layerop").off('click');
		$(".layerop").on('click', function(e) {// 图层透明度设置
			var spos = e.clientX - $(this).offset().left;
			var op = Math.round((40 - spos) * 100.0 / 40);
			var code = $(this).attr("code");
			var opval = (100 - op) / 100.0;
			if (opval > 0.5) {
				$(this).html((100 - op) + "&nbsp;<span></span>");
			} else {
				$(this).html("<span>&nbsp;" + (100 - op) + "</span>");
			}
			$(this).children("span").css({
				'width' : op + '%'
			});
			$(this).attr("title", (100 - op) + "%");
			layer_opacity[code] = opval;
			showMapLayer(layer_select, layer_opacity);
			return false;
		});
		layer_select = [];
		$('#layerTree :checked').each(function() {
			layer_select.push({
				code : $(this).attr("code"),
				url : $(this).attr("url"),
				options : $(this).attr("options")
			});
		});
		showMapLayer(layer_select, layer_opacity);
	});
	//初始化数据图层开启状态    
	for (var lidx = 0; lidx < layerSetting.init.length; lidx++) {
		$('#layerTree input:eq(' + layerSetting.init[lidx] + ')').click();
	}
	//初始化业务图层开启状态      
	var initLayerArr = initLayer.split(",");
	if (initLayerArr != undefined) {
		for (var initIdx = 0; initIdx < initLayerArr.length; initIdx++) {
			$('#layerTree input:eq(' + initLayerArr[initIdx] + ')').click();
		}
	}
	$(layerDiv).addClass("aj-tuceng");
	$('.toolbar1').hide();
	// 初始化区域覆盖
	var reginInfo = {
		"affiliation" : orgPdAffiliation,
		"codeP" : orgPdprovince,
		"codeC" : orgPdcity,
		"codeA" : orgPdarea
	};
	var searchCond = {
		"yingjiType" : 0,
		"sourceType" : 0,
		"keyWord" : "江西省",
		"level" : 11,
		"mapBound" : "-180,0,180,90",
		"queryType" : 1,
		"start" : 0,
		"count" : 10,
		"queryTerminal" : 10000
	};
	if (reginInfo.affiliation == "01100002") {
		searchCond.keyWord = province;
		drawRegionShape(JSON.stringify(searchCond));
	} else if (reginInfo.affiliation == "01100003") {
		searchCond.keyWord = city;
		drawRegionShape(JSON.stringify(searchCond));
	} else if (reginInfo.affiliation == "01100004") {
		searchCond.keyWord = area;
		drawRegionShape(JSON.stringify(searchCond));
	}
	// 地图缩放完成事件
	map.on('zoomend', function(e) {
		var zoom = map.getZoom();
		if (zoom < 7) {
			if (map.hasLayer(layerObj["layer_public_field_area"])) {
				map.removeLayer(layerObj["layer_public_field_area"]);
			}
		} else {
			if (layerObj["layer_public_field_area"] != undefined) {
				map.addLayer(layerObj["layer_public_field_area"]);
			}
		}
	});
	// 点击右键清除工具事件和右键菜单
	jQuery('document').ready(function() {
		loadReady();
	});
	var fullstate = 0;
	// 监听退出全屏事件
	window.onresize = function() {
		if (!checkFull() && fullstate == 1) {
			if (parent.document.getElementById("welcome") != undefined) {
				parent.document.getElementById("welcome").src = "location/welcome";
				parent.location.href = "main/index";
			}
		} else {
			fullstate = 1;
		}
	};
}
/**
 * 初始化函数 主接口   map
 * @param result
 */
function loadControlMap(result) {
	mapNode = "map";
	copyright = result.copyright;
	// $("#map").css({"min-height":mapHeight+'px'});
	// 创建map对象
	map = L.map('map', {
		minZoom : 3,
		maxZoom : 17,
		fullscreenControl : true,
		fullscreenControlOptions : {
			title : "全屏浏览",
			titleCancel : "退出全屏",
			position : 'topright'
		}
	});
	// 比例尺
	L.control.scale({
		imperial : false
	}).addTo(map);
	ControlBar = L.Control.extend({
		initialize : function(foo, options) {
			L.Util.setOptions(this, options);
		},
		onAdd : function(map) {
			var container = L.DomUtil.create('div', 'mycontrol');
			return container;
		}
	});
	// 备注
	map.addControl(L.control.attribution({
		"prefix" : "<a href='" + copyright.link + "' title='" + copyright.title + "'>" + copyright.name + "</a>"
	}));
	$.extend(favIconOption, iconOption);
	favIconOption.iconUrl = 'static/gis/images/fav-icon.png';
	favIconOption.iconRetinaUrl = 'static/gis/images/fav-icon-2x.png';
	markerIcon = L.icon(iconOption);
	favIcon = L.icon(favIconOption);
	map.setView([ centerPoint.latitude, centerPoint.longitude ], centerPoint.zoom);
	// 图层初始数据
	var layerSetting = eval("(" + syscfgMap.mapLayerSetting + ")");
	if (layerSetting == undefined)
		layerSetting = {
			"position" : "ESRI"
		};
	if (layerSetting.position == "ESRI") {
		map.addLayer(L.tileLayer("http://cache1.arcgisonline.cn/arcgis/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}", {
			continuousWorld : true,
			minZoom : 1,
			maxZoom : 17,
			reuseTiles : 1,
			opacity : 1
		}));
	} else if (layerSetting.position == "TIANDI") {
		map.addLayer(L.tileLayer("http://t{s}.tianditu.cn/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles",
								{
									continuousWorld : true,
									minZoom : 1,
									maxZoom : 17,
									reuseTiles : 1,
									opacity : 1,
									subdomains : [ "0", "1", "2", "3", "4", "5", "6", "7" ]
								}));
		map.addLayer(L.tileLayer("http://t{s}.tianditu.cn/cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles",
								{
									continuousWorld : true,
									minZoom : 1,
									maxZoom : 17,
									reuseTiles : 1,
									opacity : 1,
									subdomains : [ "0", "1", "2", "3", "4", "5", "6", "7" ]
								}));
	} else {
		map.addLayer(L.tileLayer("http://cache1.arcgisonline.cn/arcgis/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}", {
			continuousWorld : true,
			minZoom : 1,
			maxZoom : 17,
			reuseTiles : 1,
			opacity : 1
		}));
	}
	shape = new L.LayerGroup(); // 概览信息层
	previewLayer = new L.LayerGroup();// 绘图预览层
	map.addLayer(shape);
	map.addLayer(previewLayer);
	initPosState();
}
/**
 * 请求JSON数据
 * @param path  请求路径   String
 * @param type  请求类型   "GET"/"POST"
 * @param callback  function
 */
function getConfig(path,type,callback){
	$.ajax({
		type : type,
		url : path,
		dataType : "json",
		contentType:"application/json;charset=utf-8",
		success : function(result) {
			if(callback){callback(result);}
		},
		error : function(result){
			if(callback){callback("error");}
		}
	});
}
/**
 * 页面右键菜单处理
 */
function loadReady(){
	jQuery('body').bind("contextmenu", function() {
		map.removeEventListener('click');
		map.removeEventListener('mousemove');
		map.removeEventListener('mousedown');
		previewLayer.clearLayers();
		//TODO   //清除测量图层   add by wanger
//		map.eachLayer(function(item,index){
//			if(item._path) item.remove();
//		});
		$('#map').css({
			'cursor' : 'default'
		});
		$('#posDiv').hide();
		leftButtonState = '';
		return false;
	});
}
/**
 * 取鼠标绝对位置
 * @param event
 * @returns {___anonymous952_975}
 */
function getXY(event) {
	var retXY = {
		x : 0,
		y : 0
	};
	var mapoffset = $('#map').offset();
	var mapscroll = $('body').scrollTop();
	retXY.x = event.originalEvent.x - mapoffset.left;
	retXY.y = event.originalEvent.y - mapoffset.top + mapscroll;
	return retXY;
}
/**
 * 截取小数点6位
 * @param v_num
 * @returns {Number}
 */
function P6(v_num) {
	v_num = Math.round(v_num * 1000000);
	v_num = v_num / 1000000;
	return v_num;
}
/**
 * 截取小数点3位
 * @param v_num
 * @returns {Number}
 */
function P3(v_num) {
	v_num = Math.round(v_num * 1000);
	v_num = v_num / 1000;
	return v_num;
}
/**
 * 截取小数点2位
 * @param n
 * @returns {Number}
 */
function P2(n) {
	n = Math.round(n * 100);
	n = n / 100.00;
	return n;
}
/**
 * 显示经纬度
 * @param event
 */
function showLatlntDiv(event) {
	var mpos = getXY(event);
	var htmlstr = "";
	if(mapNode == "map"){
		htmlstr = P2(event.latlng.lng) + "," + P2(event.latlng.lat);
		posAddr = PointInPCA(event.latlng);
		if (posAddr.position != undefined) {
			htmlstr = P2(posAddr.position[0]) + "," + P2(posAddr.position[1]) + "<br>";
			if (posState == 1) {
				htmlstr += posAddr.province[0] + "_" + posAddr.province[1] + "<br>";
				htmlstr += posAddr.city[0] + "_" + posAddr.city[1] + "<br>";
				htmlstr += posAddr.area[0] + "_" + posAddr.area[1];
			}
		}
	}else if(mapNode == "mapStat"){
		htmlstr = P3(event.latlng.lng) + "<br>" + P3(event.latlng.lat);
	}
	$("#posDiv").html(htmlstr);
	$("#posDiv").css({
		'position' : 'absolute',
		'left' : mpos.x + 30,
		'top' : mpos.y + 5
	});
	$("#posDiv").show();
}

//mapstat.jsp
/**
 * 图层控制
 */
function showMapLayer(selLayerArr, opacityArr) {
	// 展示图层并设置透明度
	try {
		for (var i = 0; selLayerArr != undefined && i < selLayerArr.length; i++) {
			var layername = selLayerArr[i].code;
			var layerType = layername.split("_");
			if (layerObj[layername] == undefined) {// 新初始化的图层
				if (layerType[1] == "base") {// 项目信息概览层
					layerObj[layername] = shape;
					map.addLayer(layerObj[layername]);
				} else if (layerType[1] == "tile") {// 瓦片服务器底图层
					var tileOptions = eval("(" + selLayerArr[i].options + ")");
					if (opacityArr[layername] != undefined) {
						tileOptions.opacity = opacityArr[layername];
					}
					layerObj[layername] = L.tileLayer(selLayerArr[i].url, tileOptions);
					map.addLayer(layerObj[layername]);
				} else if (layerType[2] == "mark") {// 散点标记图层
					var markOptions = eval("(" + selLayerArr[i].options + ")");
					if (opacityArr[layername] != undefined) {
						markOptions.opacity = opacityArr[layername];
					}
					drawMark(layerType[3], selLayerArr[i].url, layername);
				} else if (layerType[2] == "field") {// 点线面元素图层
					var markOptions = eval("(" + selLayerArr[i].options + ")");
					if (opacityArr[layername] != undefined) {
						markOptions.opacity = opacityArr[layername];
					}
					drawFieldArea(layerType[3], selLayerArr[i].url, layername);
				} else if (layerType[2] == "png") {// 叠加图片图层
					var pngOptions = eval("(" + selLayerArr[i].options + ")");
					var sw = eval("([" + pngOptions.southwest + "])");
					var ne = eval("([" + pngOptions.northeast + "])");
					var img0 = new L.imageOverlay(selLayerArr[i].url, [ [ sw[1], sw[0] ], [ ne[1], ne[0] ] ], {
						opacity : 0.5
					});
					layerObj[layername] = img0;
					map.addLayer(layerObj[layername]);
				} else if (layerType[2] == "shp") {// SHP数据包
					var shpOptions = eval("(" + selLayerArr[i].options + ")");
					var shpstyle = eval("({" + shpOptions.shpstyle + "})");
					var shplayer = new L.LayerGroup();
					var shppath = selLayerArr[i].url;
					var shpgeo = L.geoJson({
						features : []
					}, {
						style : function(feature) {
							return shpstyle;
						},
						onEachFeature : function(feature, layer) {
							var myLat, myLng;
							if (shpstyle.drawName == 'true' || shpstyle.drawMark == 'true') {
								var gtype = feature.geometry.type;
								if (gtype == "Polygon") {
									myLat = (feature.geometry.bbox[0] + feature.geometry.bbox[2]) / 2;
									myLng = (feature.geometry.bbox[1] + feature.geometry.bbox[3]) / 2;
								} else if (gtype == "Point") {
									myLat = feature.geometry.coordinates[0];
									myLng = feature.geometry.coordinates[1];
								}
							}
							if (shpstyle.drawMark == 'true') {
								var myHtml = '<div style="' + toStyle(shpstyle) + '">○</div>';
								var myIcon1 = L.divIcon({
									html : myHtml,
									className : 'shapetxt',
									iconSize : [ 20, 20 ],
									iconAnchor : [ 0, 10 ],
									popupAnchor : [ 0, 0 ]
								});
								var myMark = new L.Marker([ myLng, myLat ], {
									icon : myIcon1
								});
								shplayer.addLayer(myMark);
							}
						}
					});
					shp(shppath).then(function(data) {
						shpgeo.addData(data);
					});
					if (shpstyle.drawShape != 'false')
						shplayer.addLayer(shpgeo);
					layerObj[layername] = shplayer;
					map.addLayer(layerObj[layername]);
				}
			} else {// 已初始化的图层
				if (map.hasLayer(layerObj[layername])) {
					map.removeLayer(layerObj[layername]);
				}
				if (opacityArr[layername] != undefined) {
					if (layerObj[layername].opacity != undefined) {
						layerObj[layername].opacity = opacityArr[layername];
					} else if (layerObj[layername].options != undefined) {
						layerObj[layername].options["opacity"] = opacityArr[layername];
						if (layerObj[layername]._image != undefined) {
							layerObj[layername].setOpacity(opacityArr[layername]);
						}
					} else {
						var objArr = layerObj[layername].getLayers();
						for (var j = 0; j < objArr.length; j++) {
							objArr[j].options["opacity"] = opacityArr[layername];
						}
					}
				}
				map.addLayer(layerObj[layername]);
			}
		}
	} catch (e) {
	}
	// 关闭不展示的图层
	for ( var layername in layerObj) {
		var inflag = 0;
		for (var i = 0; selLayerArr != undefined && i < selLayerArr.length; i++) {
			if (selLayerArr[i].code == layername) {
				inflag = 1;
				break;
			}
		}
		if (inflag == 0 && map.hasLayer(layerObj[layername])) {
			map.removeLayer(layerObj[layername]);
		}
	}
	// 消除阴影
	$('.leaflet-marker-icon').each(function() {
		$(this).css("z-index", 599);
		if ($(this).css("z-index") < 0) {
			$(this).css("z-index", "599");
		}
	});
}
/**
 * 范围标注
 */
function setPoints() {
	var points = $('#pointsDiv textarea').val().trim().replace("\r", " ").replace("\n", " ").split(/\s+/);
	if (points.length > 2) {
		wayPolygonData = [];
		for (var i = 0; i < points.length; i++) {
			var tmpArr = points[i].split(",");
			wayPolygonData.push([ tmpArr[1] * 1, tmpArr[0] * 1 ]);
		}
		wayPolygon = new L.Polygon(wayPolygonData, {
			color : "blue",
			weight : 2
		});
		shape.addLayer(wayPolygon);
		wayPolygon.on("click", function(e) {
			if (leftButtonState != "_startMeasure") {
				$('#config_id').val("");
				$('#config_name').val("");
				$('#config_project').val("");
				$('#config_type').val("500107");
				var tmpjsonStr = "[";
				for (var i = 0; i < wayPolygonData.length; i++) {
					if (i > 0)
						tmpjsonStr += ",";
					tmpjsonStr += "[" + P6(wayPolygonData[i].lat) + "," + P6(wayPolygonData[i].lng) + "]";
				}
				tmpjsonStr += "]";
				$('#config_coord').val(tmpjsonStr);
				showConfigDiv(e, this);
			} else {
				map.click();
			}
		});
	}
	$('#pointsDiv').hide();
}
/**
 * 抓取样式
 * @param o
 * @returns
 */
function toStyle(o) {
	var arr = [];
	var fmt = function(s) {
		if (typeof s == 'object' && s != null)
			return json2str(s);
		return /^(string|number)$/.test(typeof s) ? s : s;
	};
	for ( var i in o) {
		if (i.indexOf("draw") == 0)
			continue;
		arr.push(i + ":" + fmt(o[i]));
	}
	return arr.join(';');
}
/**
 * 绘制散点
 * @param type
 * @param url
 * @param layername
 */
function drawMark(type, url, layername) {
	$.ajax({
		type : "POST",
		url : url,
		dataType : "json",
		success : function(result) {
			if (result.code === 0) {
				var markGroup = new L.LayerGroup();
				for (var i = 0; i < result.data.length; i++) {
					var tmpMark = result.data[i];
					var iconType = type;
					tmpMark.latitude = (tmpMark.latitude == undefined) ? 0 : tmpMark.latitude;
					tmpMark.longtitude = (tmpMark.longtitude == undefined) ? 0 : tmpMark.longtitude;
					if (type == 'risk' || type == 'latent') {
						if(tmpMark.pwuName){
							if (tmpMark.pwuName.length > 13) {
								tmpMark["_mark_title"] = tmpMark.pwuName.substr(0, 12) + '...';
							} else {
								tmpMark["_mark_title"] = tmpMark.pwuName;
							}
						}else{
							tmpMark["_mark_title"] = "";
						}
						tmpMark["_mark_type"] = tmpMark.typeName ? tmpMark.typeName : "";
						if(tmpMark.name){
							if (tmpMark.name.length > 28) {
								tmpMark["_mark_data"] = tmpMark.name.substr(0, 27) + '...';
							} else {
								tmpMark["_mark_data"] = tmpMark.name;
							}
						}else{
							tmpMark["_mark_data"] = "";
						}
					} else if (type == 'emergency') {
						tmpMark["_mark_title"] = tmpMark.materialCategoryName;
						tmpMark["_mark_type"] = "";
						tmpMark["_mark_data"] = tmpMark.materialDesc;
					} else if (type == 'accident') {
						tmpMark["_mark_title"] = tmpMark.reportDepName;
						tmpMark["_mark_type"] = tmpMark.typeName;
						tmpMark["_mark_data"] = tmpMark.accidentSummary;
					} else if (type == 'item') {
						tmpMark["_mark_title"] = tmpMark.name;
						iconType = tmpMark.type;
						if (tmpMark.type == "item") {
							tmpMark["_mark_type"] = "项目";
						} else if (tmpMark.type == 'itemDetail') {
							tmpMark["_mark_type"] = "合同段";
						}
						tmpMark["_mark_data"] = tmpMark.desc;
					}
					var myMark = new L.Marker([ tmpMark.latitude, tmpMark.longtitude ], {
						icon : eval(iconType + 'Icon'),
						id : tmpMark.id,
						type : iconType,
						info : tmpMark
					});
					myMark.on("mouseover", function(e) {
						var latlng = this.getLatLng();
						var pophtml = '<div class="hintDiv">';
						pophtml += '<h5>' + this.options.info["_mark_title"] + '</h5>' + this.options.info["_mark_type"] + '<br>';
						pophtml += '<b>' + this.options.info["_mark_data"] + '</b><br>';
						pophtml += '</div>';
						layerPopup = L.popup({
							offset : L.point(0, -25),
							autoPan : false
						});
						layerPopup.setLatLng(latlng);
						layerPopup.setContent(pophtml);
						layerPopup.openOn(map);
					});
					myMark.on("click", function() {
						var url = "";
						if (type == 'risk') {
							url = '/transport/riskregister/goView.do?ssoid=' + ssoid + '&id=' + $(this)[0].options.id;
						} else if (type == 'latent') {
							url = '/transport/latentregister/goView.do?ssoid=' + ssoid + '&id=' + $(this)[0].options.id + '&closeButtenType=0';
						} else if (type == 'accident') {
							url = '/construct/accident/accidentStatistics/goView.do?ssoid=' + ssoid + '&id=' + $(this)[0].options.id + '&typeCode='
									+ $(this)[0].options.info.typeCode;
						} else if (type == 'emergency') {
							url = '/construct/build/emergencyrelmater/goView.do?ssoid=' + ssoid + '&id=' + $(this)[0].options.id;
						} else if (type == 'item') {
							if ($(this)[0].options.type == "item") {
								url = '/construct/item/libitem/goView.do?ssoid=' + ssoid + '&id=' + $(this)[0].options.id + '&closeButtonType=1';
							} else if ($(this)[0].options.type == 'itemDetail') {
								url = '/construct/item/libdetail/goView.do?ssoid=' + ssoid + '&id=' + $(this)[0].options.id + '&closeButtonType=1';
							}
						}
						if (url) {
							top.layer.open({
								type : 2,
								title : '详情信息',
								maxmin : true,
								content : url,
								area : [ '807px', '460px' ]
							});
						}
					});
					markGroup.addLayer(myMark);
				}
				layerObj[layername] = markGroup;
				map.addLayer(layerObj[layername]);
			}
		}
	});
}
/**
 * 绘制区域
 * @param type
 * @param url
 * @param layername
 */
function drawFieldArea(type, url, layername) {
	$.ajax({
		type : "POST",
		url : url,
		dataType : "json",
		success : function(result) {
			if (result.code === 0) {
				var fieldGroup = new L.LayerGroup();
				for (var i = 0; i < result.data.length; i++) {
					var tmpArea = result.data[i];
					var tmpScope = eval("(" + tmpArea.regionalScope + ")");
					if (tmpScope != undefined && tmpScope.type != undefined) {
						var fieldColor = "blue";
						if (tmpArea.regionalCategory == "90200001") {
							fieldColor = "red";
						} else if (tmpArea.regionalCategory == "90200002") {
							fieldColor = "orange";
						}
						var myArea = undefined;
						if (tmpScope.type == "90300001") {// 中心点
							myArea = new L.circle(tmpScope.center, tmpScope.radius, {
								color : fieldColor,
								weight : 1,
								fill : true,
								fillColor : fieldColor,
								opacity : 0.5,
								areaId : tmpArea.id,
								type : tmpArea.regionalCategoryName
							});
						} else if (tmpScope.type == '90300002') {// 线段路径
							myArea = new L.polyline(tmpScope.data, {
								color : fieldColor,
								weight : 2,
								areaId : tmpArea.id,
								type : tmpArea.regionalCategoryName
							});
						} else if (tmpScope.type == '90300003') {// 多边形范围
							myArea = new L.Polygon(tmpScope.data, {
								color : fieldColor,
								weight : 2,
								areaId : tmpArea.id,
								type : tmpArea.regionalCategoryName
							});
						}
						if (myArea != undefined) {
							myArea.on("mouseover", function(e) {
								var latlng = e.latlng;
								var pophtml = '<div class="hintDiv">';
								pophtml += '<h5>' + this.options.type + '</h5><br>';
								pophtml += '<b></b><br>';
								pophtml += '</div>';
								layerPopup = L.popup({
									offset : L.point(0, -25),
									autoPan : false
								});
								layerPopup.setLatLng(latlng);
								layerPopup.setContent(pophtml);
								layerPopup.openOn(map);
							});
							myArea.on("click", function(e) {
								drawFieldElement(e, fieldGroup);
							});
							fieldGroup.addLayer(myArea);
						}
					}
				}
				layerObj[layername] = fieldGroup;
				map.addLayer(layerObj[layername]);
			}
		}
	});
}
/**
 * 绘制区域中的点线面元素
 * @param event
 * @param fieldGroup
 */
function drawFieldElement(event, fieldGroup) {
	var options = event.target.options;
	if (options.areaId != undefined && options.clickcount == undefined) {
		$.ajax({
			type : "POST",
			url : "/construct/build/fieldareadetail/list.do?ssoid=" + ssoid + "&areaId=" + options.areaId + "&state=0&page=1&limit=1000",
			dataType : "json",
			success : function(result) {
				if (result.code === 0) {
					for (var i = 0; i < result.data.length; i++) {
						var tmpEle = result.data[i];
						var tmpScope = eval("(" + tmpEle.locationData + ")");
						var myElement = undefined;
						var fieldColor = "blue";
						if (tmpEle.bussinessCategory == "90400001") {
							fieldColor = "green";
						} else if (tmpEle.bussinessCategory == "90400002") {
							fieldColor = "black";
						}
						if (tmpScope != undefined && tmpScope.type != undefined) {
							if (tmpEle.shapeCategory == '90300001') {// 中心点
								myElement = new L.Marker(tmpScope.data[0], {
									icon : markerIcon,
									type : tmpEle.bussinessCategoryName,
									description : tmpEle.description
								});
							} else if (tmpEle.shapeCategory == '90300002') {// 线段路径
								myElement = new L.polyline(tmpScope.data, {
									color : fieldColor,
									weight : 2,
									type : tmpEle.bussinessCategoryName,
									description : tmpEle.description
								});
							} else if (tmpEle.shapeCategory == '90300003') {// 多边形范围
								myElement = new L.Polygon(tmpScope.data, {
									color : fieldColor,
									weight : 2,
									type : tmpEle.bussinessCategoryName,
									description : tmpEle.description
								});
							} else if (tmpEle.shapeCategory == '90300004') {// 图片叠加
								myElement = new L.imageOverlay("/authentic/dfs/download.do?id=" + tmpEle.fileId, tmpScope.data, {
									opacity : 0.5
								});
							} else if (tmpEle.shapeCategory == '90300005') {// 普通全景
								myElement = new L.Marker(tmpScope.data[0], {
									icon : skyboxIcon,
									type : tmpEle.bussinessCategoryName,
									imgType : 'normal',
									fileId : tmpEle.fileId,
									description : tmpEle.description
								});
							} else if (tmpEle.shapeCategory == '90300006') {// 深度全景
								myElement = new L.Marker(tmpScope.data[0], {
									icon : skyboxIcon,
									type : tmpEle.bussinessCategoryName,
									imgType : 'skybox',
									fileId : tmpEle.fileId,
									description : tmpEle.description
								});
							}
						}
						if (myElement != undefined) {
							myElement.on("mouseover", function(e) {
								var latlng = e.latlng;
								var imgType = this.options.imgType;
								var pophtml = '<div class="hintDiv"';
								if (imgType != undefined && imgType != "" && imgType != "null") {
									pophtml += 'style="height:150px;overflow:hidden"><h5>' + this.options.type + '</h5><br>';
									pophtml += '<img style="width:100%" src="/authentic/dfs/download.do?id=' + this.options.fileId + '"/><br>';
								} else {
									pophtml += '><h5>' + this.options.type + '</h5><br>';
									if (this.options.description != undefined) {
										pophtml += '' + this.options.description + '<br>';
									} else {
										pophtml += '<br>';
									}
								}
								pophtml += '</div>';
								layerPopup = L.popup({
									offset : L.point(0, -25),
									autoPan : false
								});
								layerPopup.setLatLng(latlng);
								layerPopup.setContent(pophtml);
								layerPopup.openOn(map);
							});
							myElement.on("click", function(e) {
								var imgType = this.options.imgType;
								if (imgType != undefined && imgType != "" && imgType != "null") {
									parent.layer.open({
										type : 2,
										title : '全景展示',
										maxmin : true,
										content : "/authentic/webgis/panorama.do?imgType=" + imgType + "&fileId=" + this.options.fileId,
										area : [ '807px', '460px' ]
									});
								}
							});
							fieldGroup.addLayer(myElement);
							options["clickcount"] = 1;
						}
					}
				}
			}
		});
	}
}
/**
 * 覆盖物点击事件 弹出属性设置
 * @param event
 * @param element
 */
function showConfigDiv(event, element) {
	var mpos = getXY(event);
	$('#configDiv').css({
		'left' : (mpos.x + 13),
		'top' : (mpos.y + 22)
	});
	$('#configDiv').show();
	$('#leaflet_id').val(element._leaflet_id);
}
/**
 * 定位到坐标
 */
function setPosition() {
	var posMarker;
	var lng = $('#paramDiv input:eq(0)').val();
	var lat = $('#paramDiv input:eq(1)').val();
	if (lng * 1 != lng || lat * 1 != lat || lng < -180 || lng > 180 || lat < 0 || lat > 90) {
		layer.msg('经纬度输入有误', {
			icon : 1,
			skin : 'layui-layer-lan'
		});
		return;
	}
	map.setView([ lat, lng ], 8);
	posMarker = new L.Marker(new L.latLng(lat, lng), {
		icon : markerIcon
	});
	shape.addLayer(posMarker);
	posMarker.on("click", function(e) {
		$('#config_name').val("");
		$('#config_id').val("");
		$('#config_project').val("");
		$('#config_type').val("500105");
		$('#config_coord').val("[[" + P6(this._latlng.lat) + "," + P6(this._latlng.lng) + "]]");
		showConfigDiv(e, this);
	});
	$('#paramDiv').hide();
}
/**
 * 层居中
 * @param divName
 */
function setDivCenter(divName) {
	var top = $(window).height() / 2 - $(divName).height();
	var left = $(window).width() / 2 - $(divName).width();
	var scrollTop = $(document).scrollTop();
	var scrollLeft = $(document).scrollLeft();
	$(divName).css({
		position : 'absolute',
		'top' : top + scrollTop,
		'left' : left + scrollLeft
	}).show();
}
/**
 * 查找最北点
 * @param latlngs
 * @returns
 */
function getNorthPoint(latlngs) {
	var idx = 0;
	for (var i = 0; i < latlngs.length; i++) {
		if (latlngs[i].lat > latlngs[idx].lat) {
			idx = i;
		}
	}
	return latlngs[idx];
}
/**
 * 查找最东点
 * @param latlngs
 * @returns
 */
function getEstPoint(latlngs) {
	var idx = 0;
	for (var i = 0; i < latlngs.length; i++) {
		if (latlngs[i].lng > latlngs[idx].lng) {
			idx = i;
		}
	}
	return latlngs[idx];
}
/**
 * 获取图层样式
 * @param idx
 * @returns {String}
 */
function getLayerStyle(idx) {
	if (layerSetting.display[idx] == 0) {
		return "style='display:none'";
	} else {
		return "";
	}
}
/**
 * 关键字查询
 * @param keyWord
 */
function drawRegionShape(keyWord) {
	try {
		jQuery.ajax({
			url : "http://map.tianditu.gov.cn/data/query?postStr=" + keyWord + "&type=query",
			dataType : "json",
			cache : true
		}).done(function(data) {
			if (data.area != undefined && data.resultType == 3) {// 查询成功
				var pointData0 = [];
				var boundsArr = data.area.bound.split(",");
				for (var idx = 0; idx < data.area.points.length; idx++) {
					var pointArr = data.area.points[idx].region.split(",");
					var pointData = [];
					for (var pidx = 0; pidx < pointArr.length; pidx++) {
						var pointLatlon = pointArr[pidx].split(" ");
						pointData.push([ pointLatlon[1] * 1, pointLatlon[0] * 1 ]);
					}
					if (layerSetting.region == "dark") {
						var rPolygon = new L.Polygon(pointData, {
							color : 'blue',
							weight : 2
						});
						shape.addLayer(rPolygon);
					} else if (layerSetting.region == "line") {
						var rPolyline = new L.Polyline(pointData, {
							color : "blue",
							weight : 2
						});
						shape.addLayer(rPolyline);
					} else if (layerSetting.region == "light") {
						pointData0.push(pointData);
					}
				}
				if (layerSetting.region == "light") {
					var rPolygon = new L.Polygon([ [ [ -90, 180 ], [ -90, -180 ], [ 90, -180 ], [ 90, 180 ] ], pointData0 ], {
						color : 'rgba(100,100,255,0.3)',
						fillColor : '#fff',
						fillOpacity : 0.95,
						weight : 6
					});
					shape.addLayer(rPolygon);
				}
				map.fitBounds([ [ boundsArr[1], boundsArr[0] ], [ boundsArr[3], boundsArr[2] ] ]);
			}
		});
	} catch (ee) {
	}
}
/**
 * 获取全屏状态
 * @returns {Boolean}
 */
function checkFull() {
	var isFull = document.fullscreenEnabled || window.fullScreen || document.webkitIsFullScreen || document.msFullscreenEnabled;
	if (isFull === undefined) {
		isFull = false;
	}
	return isFull;
}

//map.jsp
/**
 * 根据传入posState来初始化工具条
 *   1 : 搜索地名工具栏
 *   2 ： 地图编辑工具   点线面标注
 */
function initPosState() {
	if (posState == 1) {
		var toolBar = new ControlBar('toolBar', {
			position : 'topleft'
		});
		map.addControl(toolBar);
		var toolDiv = toolBar.getContainer();
		$(toolDiv).removeClass("mycontrol");
		var toolHtml = '<div class="search_box2">' + '<input id="keyword" type="text" style="width:200px;font-size:14px;" value="" placeholder="搜索地名"/>'
			+ '<button id="mapquery" style="cursor:pointer;margin-left:5px;color:#666" class="iconfont aj-jiansuo"></button>'
			+ '<button id="mappick" style="cursor:pointer;margin-left:5px;color:#000" class="iconfont aj-dingwei"></button>' + '<div class="place_list"></div></div>';
		$(toolDiv).html(toolHtml);
		$("#keyword").click(function(pevent) {
			pevent.stopPropagation();
			$(".place_list").css({
				"display" : "none"
			});
		});
		$("#mappick").click(function(pevent) {
			pevent.stopPropagation();
			$('#map').css({
				'cursor' : 'crosshair'
			});
			// 地图点击事件
			map.on("mousemove", function(e) {
				if (posState == 1) {
					showLatlntDiv(e);
				}
			});
			map.on('click', function(e) {
				if (posState == 1) {
					getPosAddr();
				}
				return false;
			});
		});
		$("#mappick").click();
		$("#mapquery").click(
			function() {
				var place = $("#keyword").val();
				if (place != "") {
					$.getJSON('http://www.tianditu.com/query.shtml?postStr={"keyWord":' + place + ',"level":"11","mapBound":"-180,-90,180,90","queryType":"1","count":"20","start":"0"}' + '&type=query', function(data) {
						try {
							$(".place_list").css({
								"display" : "block"
							});
							var data_string = JSON.stringify(data);
							if (data.resultType == 1) {// 普通poi搜索
								$(".search_box2 .place_list").html("");
								var string = "";
								var findflag = 0;
								for (var i = 0; i < data.pois.length; i++) {
									string += "<li lonlat='" + data.pois[i].lonlat + "'>" + (i + 1) + ".<span class='address'>" + data.pois[i].address + "</span>,"
											+ "<span class='name'>" + data.pois[i].name + "</span>" + "</li>";
									findflag = 1;
								}
								$(".search_box2 .place_list").append(string);
								// 选择具体的地方城市
								$(".search_box2 .place_list").on("click", "li", function() {
									$(".place_list").css({
										"display" : "none"
									});
									console.log($(this).attr("lonlat"));
									var array_LonLat = $(this).attr("lonlat").split(" ");
									for (var i = 0; i < 2; i++) {
										array_LonLat[i] = Number(array_LonLat[i]);
									}
									map.setView([ array_LonLat[1], array_LonLat[0] ], 13);
									var positionMark = new L.Marker(new L.latLng(array_LonLat[1], array_LonLat[0]), {
										icon : favIcon,
										zIndexOffset : 9999
									});
									shape.addLayer(positionMark);
									positionMark.on("mouseover", function(e1) {
										if (posState == 1) {
											showLatlntDiv(e1);
										}
									});
									positionMark.on("click", function(e1) {
										if (posState == 1) {
											getPosAddr();
										}
									});
								});
								if (findflag == 0) {
									$(".place_list").html("请输入带有省市行政区的全称地址进行查询。如\"安徽省黄山风景区\"");
								}
							}
						} catch (e) {
							$(".place_list").html("请输入带有省市行政区的全称地址进行查询。如\"安徽省黄山风景区\"");
						}
					});
				}
			});
		loadGeoJson("shengjie", "省界");
	} else if (posState == 2) {
		var toolBar = new ControlBar('toolBar', {
			position : 'topleft'
		});
		map.addControl(toolBar);
		var toolDiv = toolBar.getContainer();
		toolDiv.className = toolDiv.className + " iconfont aj-bianji";
		var toolHtml = "<div class='mytoolbar toolbar2'><h5>地图编辑</h5>";
			toolHtml += "<div class='external-event label-normal' code='tool_mark'><i class='iconfont aj-biaozhu'></i> 点标注</div>";
			toolHtml += "<div class='external-event label-normal' code='tool_way'><i class='iconfont aj-lujingfenxi'></i> 路径标注</div>";
			toolHtml += "<div class='external-event label-normal' code='tool_surface'><i class='iconfont aj-fanweibiaoji'></i> 范围标注</div>";
		$(toolDiv).html(toolHtml);
		// 地图工具
		$(".toolbar2 .external-event").on("mouseover", function() {
			$(".toolbar2 .external-event").each(function() {
				if (!$(this).hasClass("label-normal")) {
					$(this).addClass("label-normal");
					$(this).children("i").removeClass("white");
					$(this).children("i").addClass("blue");
				}
			});
			$(this).removeClass("label-normal");
			$(this).children("i").removeClass("blue");
			$(this).children("i").addClass("white");
		});
		$(".toolbar2 .external-event").on("click", function() {
			var cmdstr = $(this).attr('code');
			map.removeEventListener('click');
			map.removeEventListener('mousemove');
			$('#map').css({
				'cursor' : 'default'
			});
			$('#posDiv').hide();
			if (cmdstr == 'tool_mark') {// 点标注
				$('#map').css({
					'cursor' : 'crosshair'
				});
				$('.toolbar2').mouseout();
				leftButtonState = 'tool_mark';
				map.on('mousemove', function(e) {
					showLatlntDiv(e);
				});
				map.on('click', function(e) {
					var pointMark = new L.Marker(new L.latLng(e.latlng.lat, e.latlng.lng), {
						icon : markerIcon,
						zIndexOffset : 9999
					});
					shape.addLayer(pointMark);
					pointMark.on("click", function(e) {
						var tmpjsonStr = '{"type":"90300001","data":[[' + P6(this._latlng.lat) + ',' + P6(this._latlng.lng) + ']]}';
						var index = parent.layer.getFrameIndex(wname);
						var body = parent.layer.getChildFrame('body', index);
						body.contents().find("#" + posObj).val(tmpjsonStr);
						console.log(tmpjsonStr);
						index = parent.layer.getFrameIndex(window.name); // 先得到当前iframe层的索引
						parent.layer.close(index); // 再执行关闭
					});
				});
				return false;
			} else if (cmdstr == 'tool_way') {// 路径标注
				$('#map').css({
					'cursor' : 'pointer'
				});
				$('.toolbar2').mouseout();
				leftButtonState = 'tool_way';
				wayPolyLineData = [];
				map.on('mousemove', function(e) {
					showLatlntDiv(e);
					if (previewLayer.hasLayer(tmpPoint))
						previewLayer.removeLayer(tmpPoint);
					if (previewLayer.hasLayer(tmpLine))
						previewLayer.removeLayer(tmpLine);
					tmpPoint = new L.circle(e.latlng, 10, {
						color : "green",
						weight : 5,
						fill : true,
						fillColor : "blue"
					});
					if (wayPolyLineData.length > 0) {
						tmpLine = new L.polyline([ wayPolyLineData[wayPolyLineData.length - 1], e.latlng ], {
							color : 'green',
							weight : 1
						});
						previewLayer.addLayer(tmpLine);
					}
					previewLayer.addLayer(tmpPoint);
				});
				map.on('mousedown', function(e) {
					if (e.originalEvent.button == 0) {
						previewLayer.clearLayers();
						if (wayPolyLineData.length > 1 && shape.hasLayer(wayPolyLine))
							shape.removeLayer(wayPolyLine);
						wayPolyLineData.push(e.latlng);
						for (var i = 0; i < wayPolyLineData.length; i++) {
							previewLayer.addLayer(L.circle(wayPolyLineData[i], 10, {
								color : "green",
								weight : 5,
								fill : true,
								fillColor : "blue"
							}));
						}
						if (wayPolyLineData.length > 1) {
							wayPolyLine = new L.polyline(wayPolyLineData, {
								color : "blue",
								weight : 2
							});
							shape.addLayer(wayPolyLine);
							wayPolyLine.on("click", function(e) {
								var tmpjsonStr = "[";
								for (var i = 0; i < wayPolyLineData.length; i++) {
									if (i > 0)
										tmpjsonStr += ",";
									tmpjsonStr += "[" + P6(wayPolyLineData[i].lat) + "," + P6(wayPolyLineData[i].lng) + "]";
								}
								tmpjsonStr += "]";
								tmpjsonStr = '{"type":"90300002","data":' + tmpjsonStr + '}';
								var index = parent.layer.getFrameIndex(wname);
								var body = parent.layer.getChildFrame('body', index);
								body.contents().find("#" + posObj).val(tmpjsonStr);
								index = parent.layer.getFrameIndex(window.name); // 先得到当前iframe层的索引
								parent.layer.close(index); // 再执行关闭
							});
						}
					}
				});
				return false;
			} else if (cmdstr == 'tool_surface') {// 范围标注
				$('#map').css({
					'cursor' : 'pointer'
				});
				$('.toolbar2').mouseout();
				leftButtonState = 'tool_surface';
				wayPolygonData = [];
				map.on('mousemove', function(e) {
					showLatlntDiv(e);
					if (previewLayer.hasLayer(tmpPoint))
						previewLayer.removeLayer(tmpPoint);
					if (previewLayer.hasLayer(tmpLine))
						previewLayer.removeLayer(tmpLine);
					tmpPoint = L.circle(e.latlng, 10, {
						color : "green",
						weight : 5,
						fill : true,
						fillColor : "blue"
					});
					if (wayPolygonData.length > 1) {
						tmpLine = L.polyline([ wayPolygonData[wayPolygonData.length - 1], e.latlng, wayPolygonData[0] ], {
							color : 'green',
							weight : 1
						});
						previewLayer.addLayer(tmpLine);
					} else if (wayPolygonData.length > 0) {
						tmpLine = L.polyline([ wayPolygonData[wayPolygonData.length - 1], e.latlng ], {
							color : 'green',
							weight : 1
						});
						previewLayer.addLayer(tmpLine);
					}
					previewLayer.addLayer(tmpPoint);
				});
				map.on('mousedown', function(e) {
					if (e.originalEvent.button == 0) {
						previewLayer.clearLayers();
						if (wayPolygonData.length > 2 && shape.hasLayer(wayPolygon))
							shape.removeLayer(wayPolygon);
						if (shape.hasLayer(tmpPolyLine))
							shape.removeLayer(tmpPolyLine);
						wayPolygonData.push(e.latlng);
						for (var i = 0; i < wayPolygonData.length; i++) {
							previewLayer.addLayer(L.circle(wayPolygonData[i], 10, {
								color : "green",
								weight : 5,
								fill : true,
								fillColor : "blue"
							}));
						}
						if (wayPolygonData.length > 2) {
							wayPolygon = new L.Polygon(wayPolygonData, {
								color : "blue",
								weight : 2
							});
							shape.addLayer(wayPolygon);
							wayPolygon.on("click", function(e) {
								if (leftButtonState != "_startMeasure") {
									var tmpjsonStr = "[";
									for (var i = 0; i < wayPolygonData.length; i++) {
										if (i > 0)
											tmpjsonStr += ",";
										tmpjsonStr += "[" + P6(wayPolygonData[i].lat) + "," + P6(wayPolygonData[i].lng) + "]";
									}
									tmpjsonStr += "]";
									tmpjsonStr = '{"type":"90300003","data":' + tmpjsonStr + '}';
									var index = parent.layer.getFrameIndex(wname);
									var body = parent.layer.getChildFrame('body', index);
									body.contents().find("#" + posObj).val(tmpjsonStr);
									console.log(tmpjsonStr);
									index = parent.layer.getFrameIndex(window.name); // 先得到当前iframe层的索引
									parent.layer.close(index); // 再执行关闭
								} else {
									map.click();
								}
							});
						} else if (wayPolygonData.length > 1) {
							tmpPolyLine = new L.Polyline(wayPolygonData, {
								color : "blue",
								weight : 2
							});
							shape.addLayer(tmpPolyLine);
						}
					}
				});
				return false;
			}
		});
		// 删除标注
		$('#config_hide').click(function() {
			var lid = $('#leaflet_id').val();
			var marr = shape.getLayers();
			for (var i = 0; i < marr.length; i++) {
				if (marr[i]._leaflet_id == lid) {
					shape.removeLayer(marr[i]);
					break;
				}
			}
			$('#configDiv').hide();
			$('.leaflet-popup').hide();
		});
		// 工具条动态展示
		$(toolDiv).on("mouseover", function() {
			$('.aj-jiantou').click();
			$(this).removeClass("aj-bianji");
			$('.toolbar2').show();
		});
		$(toolDiv).on("click", function() {
			$(this).removeClass("aj-bianji");
			$('.toolbar2').show();
		});
		$(toolDiv).on("mouseout", function() {
			$(this).addClass("aj-bianji");
			$('.toolbar2').hide();
		});
	}
	// 点击右键清除工具事件和右键菜单
	jQuery('document').ready(function() {
		try {
			if (posState == 2)
				drawField();
		} catch (e) {}
		loadReady();
	});
}
/**
 * 查找点是否在多边形内部
 * @param pt
 * @param poly
 * @returns {Boolean}
 */
function PointInPoly(pt, poly) {
	for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
		((poly[i][1] <= pt.lat && pt.lat < poly[j][1]) || (poly[j][1] <= pt.lat && pt.lat < poly[i][1]))
				&& (pt.lng < (poly[j][0] - poly[i][0]) * (pt.lat - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0]) && (c = !c);
	return c;
}
/**
 * 查找点所在行政区名字和代码
 * @param pt
 * @param geo
 * @param geotype
 * @returns {String}
 */
function PointInGeo(pt, geo, geotype) {
	var i = 0, j = 0, ret = "";
	var pflag = false;
	if (geo == undefined || geo.features == undefined)
		return ret;
	for (i = 0; i < geo.features.length; i++) {
		var poly = geo.features[i].geometry.coordinates;
		var polycount = poly.length;
		if (geo.features[i].geometry.type == "Polygon") {
			pflag = PointInPoly(pt, poly[0]);
		} else {
			for (j = 0; j < polycount; j++) {
				pflag = PointInPoly(pt, poly[j][0]);
				if (pflag)
					break;
			}
		}
		if (pflag)
			break;
	}
	if (pflag) {
		if (geotype == "arcgis") {
			ret = geo.features[i].properties.NAME + "_" + geo.features[i].properties.CODE;
		} else {
			if (geotype == "shi" && (geo.features[i].properties.id + "").substring(0, 2) == "11") {
				ret = "北京市_110100";
			} else if (geotype == "shi" && (geo.features[i].properties.id + "").substring(0, 2) == "12") {
				ret = "天津市_120100";
			} else if (geotype == "shi" && (geo.features[i].properties.id + "").substring(0, 2) == "50") {
				ret = "重庆市_500100";
			} else if (geotype == "shi" && (geo.features[i].properties.id + "").substring(0, 4) == "3101") {
				ret = "市辖区_310100";
			} else if (geotype == "shi" && (geo.features[i].properties.id + "").substring(0, 4) == "3102") {
				ret = "县_310200";
			} else if (geotype == "shi" && (geo.features[i].properties.id + "").substring(0, 4) == "4690") {
				ret = "省辖县_469000";
			} else {
				ret = geo.features[i].properties.name + "_" + (geo.features[i].properties.id + "0000").substring(0, 6);
			}
		}
	}
	return ret;
}
/**
 * 查找点所在省市县
 * @param pt
 * @returns {___anonymous63909_63988}
 */
function PointInPCA(pt) {
	var addr = {
		"province" : [ "", "" ],
		"city" : [ "", "" ],
		"area" : [ "", "" ]
	};
	var pname = "", cname = "", aname = "";
	var pnamearr = [], cnamearr = [], anamearr = [];
	var pname = PointInGeo(pt, geoJsonObj["shengjie"], "arcgis");
	addr["position"] = [ pt.lng, pt.lat ];
	if (pname != "") {
		pnamearr = pname.split("_");
		addr["province"] = pnamearr;
		cname = PointInGeo(pt, geoJsonObj[pnamearr[1].substring(0, 2)], "shi");
		if (cname != "") {
			cnamearr = cname.split("_");
			addr["city"] = cnamearr;
			// 载入县界
			if (geoJsonObj[cnamearr[1].substring(0, 4)] == undefined) {
				loadGeoJsonCounty(cnamearr[1].substring(0, 4) + "00");
			}
			aname = PointInGeo(pt, geoJsonObj[cnamearr[1].substring(0, 4)], "xian");
			if (aname != "") {
				anamearr = aname.split("_");
				addr["area"] = anamearr;
			}
		}
	}
	return addr;
}
/**
 * 返回定位信息
 */
function getPosAddr() {
	if (parent != undefined) {
		var index = parent.layer.getFrameIndex(window.name);
		parent.getPos(posAddr);
		if (posAddr.position != undefined && posAddr.province != undefined && posAddr.city != undefined && posAddr.area != undefined) {
			if (posAddr.province[0] != "" && posAddr.city[0] != "")
				parent.layer.close(index);
		}
	}
}
/**
 * 抓取指定县的json数据
 * @param fname
 */
function loadGeoJsonCounty(fname) {
	jQuery.ajax({
		url : "static/gis/geometryCouties/" + fname + ".json",
		dataType : "json",
		cache : true
	}).done(function(data) {
		geoJsonObj[(data.features[0].properties.id + "").substring(0, 4)] = data;
	});
}
/**
 * 载入GEOJSON数据
 * @param shpid
 * @param shpname
 */
function loadGeoJson(shpid, shpname) {
	console.log("载入数据 " + shpname);
	jQuery.ajax({
		url : "static/gis/geojson/" + shpid + ".js",
		dataType : "script",
		cache : true
	}).done(function() {
		geoJsonObj[shpid] = eval(shpid + "_geojson");
		console.log("准备图层 " + shpname + " ... 完成");
		loadCount++;
		if (loadCount >= 1) {
			// 加载完成后的初始化
			if (posState == 1) {
				for (var i = 0; i < geoJsonObj["shengjie"].features.length; i++) {
					jQuery.ajax({
						url : "static/gis/geometryProvince/" + geoJsonObj["shengjie"].features[i].properties.CODE.substring(0, 2) + ".json",
						dataType : "json",
						cache : true
					}).done(function(data) {
//						for (var j = 0; j < data.features.length; j++) {
//							var fname = (data.features[j].properties.id + "").substring(0, 4) + "00";
//							// loadGeoJsonCounty(fname);
//						}
						var tmpPcode = data.features[0].properties.id;
						if (tmpPcode == "3681") {
							tmpPcode = "82";
						} else if (tmpPcode == "3682") {
							tmpPcode = "81";
						} else if (tmpPcode == "7001") {
							tmpPcode = "71";
						}
						geoJsonObj[tmpPcode.substring(0, 2)] = data;
					});
				}
			}
		}
	});
}
/**
 * 绘制现场区域
 */
function drawField() {
	var index = parent.layer.getFrameIndex(wname);
	var body = parent.layer.getChildFrame('body', index);
	var fieldsJson = eval("(" + body.contents().find("#" + posObj).val() + ")");
	if (fieldsJson.type == "90300001") {
		var myPoint = new L.latLng(fieldsJson.data[0][0], fieldsJson.data[0][1]);
		var pointMark = new L.Marker(myPoint, {
			icon : markerIcon,
			zIndexOffset : 9999
		});
		shape.addLayer(pointMark);
		map.flyTo(myPoint);
	} else if (fieldsJson.type == "90300002" && fieldsJson.data.length > 1) {
		wayPolyline = new L.Polyline(fieldsJson.data, {
			color : "blue",
			weight : 2
		});
		shape.addLayer(wayPolyline);
		map.fitBounds(wayPolyline.getBounds());
		wayPolyline.on("click", function(e) {
			$('#config_name').val("");
			$('#config_type').val("90300002");
			var tmpjsonStr = '{"type":"90300002","data":[[';
			for (var i = 0; i < fieldsJson.data.length; i++) {
				if (i > 0)
					tmpjsonStr += ",";
				tmpjsonStr += "[" + P6(fieldsJson.data[i][0]) + "," + P6(fieldsJson.data[i][1]) + "]";
			}
			tmpjsonStr += "]]";
			$('#config_coord').val(tmpjsonStr);
			showConfigDiv(e, this);
		});
	} else if (fieldsJson.type == "90300003" && fieldsJson.data.length > 2) {
		wayPolygon = new L.Polygon(fieldsJson.data, {
			color : "blue",
			weight : 2
		});
		shape.addLayer(wayPolygon);
		map.fitBounds(wayPolygon.getBounds());
		wayPolygon.on("click", function(e) {
			$('#config_name').val("");
			$('#config_type').val("90300003");
			var tmpjsonStr = '{"type":"90300003","data":[[';
			for (var i = 0; i < fieldsJson.data.length; i++) {
				if (i > 0)
					tmpjsonStr += ",";
				tmpjsonStr += "[" + P6(fieldsJson.data[i][0]) + "," + P6(fieldsJson.data[i][1]) + "]";
			}
			tmpjsonStr += "]]";
			$('#config_coord').val(tmpjsonStr);
			showConfigDiv(e, this);
		});
	}
}