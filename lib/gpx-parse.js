var xml2js = require("xml2js"),
	fs = require("fs"),
	GpxResult = require('./gpxResult'),
	GpxExtent = require('./gpxExtent'),
	GpxWaypoint = require('./gpxWaypoint'),
	GpxTrack = require('./gpxTrack'),
	GpxMetaData = require('./gpxMetaData'),
	GpxRoute = require('./gpxRoute'),
	geomUtils = require('./geomUtils');


/**
 * Parses the waypoints into an array of waypoints.
 */
var _getWayPoints = function(gpxWaypoints) {

	var waypoints = [],
		currentWaypoint = null,
		point = null;

	//grab waypoints
	for (var i = 0, il = gpxWaypoints.length; i < il; i++) {
		currentWaypoint = gpxWaypoints[i];
		point = new GpxWaypoint(currentWaypoint.$.lat, currentWaypoint.$.lon, currentWaypoint.ele, currentWaypoint.time);
		waypoints.push(point);
	}

	return waypoints;
};

/**
 * Parses routes into an array of route objects
 */
var _getRoutes = function(gpxRoutes) {
	//grab routes
	var routes = [],
		route = null;

	for (var i = 0, il = gpxRoutes.length; i < il; i++) {
		//clear out route points
		var routePoints = [];
		currentRoute = gpxRoutes[i];
		for (var j = 0, jl = currentRoute.rtept.length; j < jl; j++) {
			routePoints.push(new GpxWaypoint(currentRoute.rtept[j].$.lat, currentRoute.rtept[j].$.lon));
		}

		route = new GpxRoute(gpxRoutes.name, gpxRoutes.cmt, gpxRoutes.desc, routePoints);


		routes.push(route);
	}

	return routes;
};

var _getTracks = function(gpxTracks) {
	//grab tracks
	var tracks = [];

	for (var i = 0, il = gpxTracks.length; i < il; i++) {

		var trackSegments = [],
			currentTrack = gpxTracks[i];

		for (var j = 0, jl = currentTrack.trkseg.length; j < jl; j++) {

			var trackSegement = [],
				currentSegment = currentTrack.trkseg[j];

			for (var k = 0, kl = currentSegment.trkpt.length; k < kl; k++) {

				var trackPoint = currentSegment.trkpt[k],
					elevation = trackPoint.ele;

				trackSegement.push(new GpxWaypoint(trackPoint.$.lat, trackPoint.$.lon, elevation));
			}

			trackSegments.push(trackSegement);
		}

		tracks.push(new GpxTrack(trackSegments));
	}

	return tracks;
};

/**
 * Parses v1.0 data into data structure
 */
var _ParseV10 = function(gpx) {

	var extent = null,
		metadata = null;

	extent = new GpxExtent();
	metaData = new GpxMetaData(gpx.$.creator, gpx.time, extent);
	
	return new GpxResult(metaData, _getWayPoints(gpx.wpt), _getRoutes(gpx.rte), _getTracks(gpx.trk));
};

var _ParseV11 = function(gpxData) {
	var metadata = new GpxMetadata(gpx.$.creator, gpx.metadata.time);
	return new GpxResult(metadata);
};

/**
 * Parses gpx passed in as String
 * @param {string} gpxString gpxData passed in as string
 * @param {gpxParseCompleteCallback} callback Callback function to call when parse has completed.
 */
exports.parseGpx = function(gpxString, callback) {
	
	var parseString = require('xml2js').parseString,
		gpxResult = null,
		version = null;

	parseString(gpxString, function(error, data) {

		if (error) {
			callback(error, null);
			return;
		}

		version = data.gpx.$.version;
		if (version === "1.0") {
			gpxResult = _ParseV10(data.gpx);
		} else if (version === "1.1") {
			gpxResult = null;
		} else {
			callback(new Error("version not supported"), null);
			return;
		}

		callback(null, gpxResult);
	});
}


/**
 * Parse gpx from a file
 * @param {string} gpxFile Path to gpx file you want to parse
 * @param {gpxParseCompleteCallback} callback Callback function to call when parse has completed.
 */
exports.parseGpxFromFile = function(gpxFile, callback) {

	fs.open(gpxFile, "r", function(error, file) {

		if (error) {
			console.log("error");
			callback(error, null);
			return;
		}

		exports.parseGpx(file, callback);
	});
}

//expose objects
exports.GpxResult = GpxResult;
exports.GpxExtent = GpxExtent;
exports.GpxWaypoint = GpxWaypoint;
exports.GpxTrack = GpxTrack;
exports.GpxMetaData = GpxMetaData;
exports.GpxRoute = GpxRoute;
exports.utils = geomUtils;

/* Callback document for gpxParseCompleteCallback
 * @callback requestCallback
 * @param {Object} error If an error has occurred the error otherwise null
 * @param {string} responseMessage
 */