<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn"%>
<%
	String path = request.getContextPath();
	String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort()
			+ path + "/static/gis/chartMap/";
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <base href="<%=basePath%>">
    <meta charset="utf-8">
    <title>GIS一张图</title>
    <meta name="renderer" content="webkit">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="format-detection" content="telephone=no">
    
    <link rel="stylesheet" href="./css/leaflet.css" />
    <link rel="stylesheet" href="css/L.control.css" />
    <link rel="stylesheet" href="css/font-awesome.min.css" />
    <link rel="stylesheet" href="css/flat-ui.min.css" />
    <link rel="stylesheet" href="css/bootstrap.min.css" />
    <link rel="stylesheet" href="css/index.css" />
	<!--  js  -->
    <script src="js/geojson.js"></script>
    <script src="js/leaflet.js"></script>
    <script src="js/jquery.js"></script>
    <script src="js/echarts.min.js"></script>
    <script src="js/jquery.tinycarousel.min.js"></script>
    <script src="js/L.Control.Pan.js" ></script>  
    <script src="js/leaflet-tilejson.js"></script>
    <script src="js/L.Control.MousePosition.js"></script>
    <script src="js/Control.MiniMap.js"></script>
    <script src="js/bundle.js"></script>
    <script src="js/sliderbar.js"></script>
    <script src="js/leaflet.slider.js"></script>
    <script src="js/Leaflet.NavBar.js"></script>
    <script src="js/leaflet.magnifyingglass.js"></script>
    <script src="js/L.Control.Basemaps.js"></script>
    <script src="js/leaflet-search.js"></script>
    <script src="js/bar.geojson.js"></script>
    <script src="js/pharmacy.geojson.js"></script>
    <script src="js/restaurant.geojson.js"></script> 
    <script src="js/Control.FullScreen.js"></script>
    <script src="js/leaflet-measure.js"></script> 
    <script src="js/leaflet.restoreview.js"></script> 
    <script src="js/leaflet.browser.print.js"></script> 
    <script src="js/dom-to-image.js"></script> 
    <!-- <script src="js/application.js"></script> 
    <script src="js/flat-ui.min.js"></script>  -->
    <script src="js/L.Control.Window.js"></script> 
    <script src="js/data.js"></script> 
    <script src="js/exchangeData.js"></script> 
    <script src="js/PruneCluster.js"></script> 
    <script src="js/leaflet-heat.js"></script> 
    <script src="js/Leaflet.draw.js"></script>
    <script src="js/Leaflet.Draw.Event.js"></script>
    <script src="js/Toolbar.js"></script>
    <script src="js/Tooltip.js"></script>
    <script src="js/ext/GeometryUtil.js"></script>
    <script src="js/ext/LatLngUtil.js"></script>
    <script src="js/ext/LineUtil.Intersect.js"></script>
    <script src="js/ext/Polygon.Intersect.js"></script>
    <script src="js/ext/Polyline.Intersect.js"></script>
    <script src="js/ext/TouchEvents.js"></script>
    <script src="js/draw/DrawToolbar.js"></script>
    <script src="js/draw/handler/Draw.Feature.js"></script>
    <script src="js/draw/handler/Draw.SimpleShape.js"></script>
    <script src="js/draw/handler/Draw.Polyline.js"></script>
    <script src="js/draw/handler/Draw.Marker.js"></script>
    <!-- <script src="js/draw/handler/Draw.CircleMarker.js"></script>
    <script src="js/draw/handler/Draw.Circle.js"></script> -->
    <script src="js/draw/handler/Draw.Polygon.js"></script>
    <script src="js/draw/handler/Draw.Rectangle.js"></script>
    <script src="js/edit/EditToolbar.js"></script>
    <script src="js/edit/handler/EditToolbar.Edit.js"></script>
    <script src="js/edit/handler/EditToolbar.Delete.js"></script>
    <script src="js/Control.Draw.js"></script>
    <script src="js/edit/handler/Edit.Poly.js"></script>
    <script src="js/edit/handler/Edit.SimpleShape.js"></script>
    <script src="js/edit/handler/Edit.Marker.js"></script>  
    <script src="js/easy-button.js" ></script>   
    <script src="js/edit/handler/Edit.Rectangle.js"></script>
    <script src="js/L.Icon.Pulse.js"></script>
    <script src="js/customToolbar.js"></script>
    <!-- EchartsLayer -->
    <script src="js/proj4.js"></script>
    <script src="js/EChartsLayer/Proj4Leaflet.js"></script>
    <script src="js/EChartsLayer/Attributions.js"></script>
    <script src="js/EChartsLayer/Base.js"></script>
    <script src="js/EChartsLayer/ExtendsCRS.js"></script>
    <script src="js/EChartsLayer/NonEarthCRS.js"></script>
    <script src="js/EChartsLayer/EChartsLayer.js"></script>
    <!-- GridLayer -->
    <script src="js/GridLayer/mapv.js"></script>
    <script src="js/GridLayer/elasticsearch.min.js"></script>
    <script src="js/GridLayer/MapVRenderer.js"></script>
    <script src="js/GridLayer/MapVLayer.js"></script>
    <!-- Spatial analysis -->
    <script src="js/turf.min.js"></script>
    <!-- 分页 -->
    <script src="js/myPagination.js"></script>
    <!-- 实时数据展示 -->
    <script src="js/leaflet-realtime.js"></script>
    <script src="js/index.js"></script>
</head>
<body>
	<div class="mainDiv">
      <div id="map"></div>
      <div id="videoDock">
        <div id="dockContainer" class="dock-container"></div>
      </div>
    </div>
	<script>
    	//所有取后台传递过来的参数       都必须在jsp页面执行
    	var ssoid = "${sessionScope.ssoid}";
    	var wname = '${pd.get("wname")}';//索引参数记录
	    var posObj = '${pd.get("posObj")}';
		jQuery.ajaxSetup({cache: true}); //jquery缓存页面 
		/*var centerPoint={"longitude":107,"latitude":34,"zoom":4};    
	    <c:if test='${pd.get("longitude")!=null && pd.get("latitude")!=null}'>
	    	centerPoint.latitude = ${pd.get("latitude")};
	    	centerPoint.longitude = ${pd.get("longitude")};
	    </c:if>
	    <c:if test='${pd.get("zoom")!=null}'>
	    	centerPoint.zoom = ${pd.get("zoom")};
	    </c:if>*/
	    window.onload = function(){
	    	getConfig();
		}	
	</script>
</body>
</html>