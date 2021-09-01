var pricechart = dc.pieChart("#price-chart");
var foodChart = dc.barChart('#food-chart');
var ratingchart = dc.rowChart('#rating-chart');
var restTable = dc.dataTable('#rest-table');
var restCount = dc.dataCount('.dc-data-count');
var markers = [];

var allDim;

var latDimension;
var lngDimension;


var restMarkers = new L.FeatureGroup();
var ndx;
var map = L.map('map',{preferCanvas:true}).setView([3.140853, 101.693207], 13);

var osm=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})

osm.addTo(map);

d3.csv(window.CrossFilter.config.dataUrl,  function (data) {

	var numberFormat = d3.format('.0f');
	
	var fdata=data;

	
	
	ndx = crossfilter(data);

	
	
	var all = ndx.groupAll();
	
	latDimension = ndx.dimension(function(p) { return p.latitude; });
  	lngDimension = ndx.dimension(function(p) { return p.longitude; });
  	map.on("moveend", function(e){
    	var bounds = map.getBounds()
	var northEast = bounds.getNorthEast();
	var southWest = bounds.getSouthWest();

    	// NOTE: need to be careful with the dateline here
    	lngDimension.filterRange([southWest.lng, northEast.lng]);
    	latDimension.filterRange([southWest.lat, northEast.lat]);

    	// NOTE: may want to debounce here, perhaps on requestAnimationFrame

	setTimeout(function() {
  	dc.renderAll()
		}, 700);
    
	});
	

	var allDim = ndx.dimension(function(d) {return d;});

	var priceDimension = ndx.dimension(function (d) {
      		return d.price_category;
	});

	var foodDimension = ndx.dimension(function (d) {
      		return d.food_category;
	});

	var ratingDimension = ndx.dimension(function (d) {
      		return d.rating_group;
	});

	var priceGroup =priceDimension.group().reduceCount(function (d) {
      		return d.price_category;
  	});


	var foodGroup =foodDimension.group().reduceCount(function (d) {
      		return d.food_category;
  	});

	var ratingGroup =ratingDimension.group().reduceCount(function (d) {
      		return d.rating_goup;
  	});

	restCount
		.dimension(ndx)
    		.group(all)


	pricechart
		.width(400)
    		.height(263)
    		.slicesCap(3)
		
		.ordinalColors(['#3cef2c','#ab2cef','#ef3b2c'])
    		.innerRadius(40)
    		.dimension(priceDimension)
    		.group(priceGroup)
		.on('pretransition', function(chart) {
        		chart.selectAll('text.pie-slice').text(function(d) {
            		return d.data.key + ' ' + dc.utils.printSingleValue((d.endAngle - d.startAngle) / (2*Math.PI) * 100) + '%';
        		})

   		 });

	foodChart
		.width(950)
    	    	.height(300)
    	    	.x(d3.scale.ordinal())
    		.xUnits(dc.units.ordinal)
    		.margins({top: 20, left: 30, right: 10, bottom: 50})
    		.group(foodGroup)
    		.dimension(foodDimension)
		.xAxisLabel('Food groups')
		.yAxisLabel('No. of restaurants')
    		.barPadding(0.1)
    		.outerPadding(0.05)
    		.brushOn(false)
		.ordinalColors(["#1190c2"])
    		.y(d3.scale.sqrt())
    		.elasticY(true)
    		.yAxis().ticks(5);

	ratingchart
		.width(400)
    		.height(300)
    		.margins({top: 20, left: 25, right: 30, bottom: 40})
    		.elasticX(true)
    		.dimension(ratingDimension)
    		.group(ratingGroup)
		.x(d3.scale.sqrt()
		.domain([0, 300])
          	.range([0,ratingchart.effectiveWidth()])
          	.clamp(true));

	restTable
    		.dimension(allDim)
		.group(function (d) {
                            return 'kkkk';})
    		.size(Infinity)
    		.columns([
       	 	function(d) {return d.name;},
        	function(d) {return d.food_category;},
        	function(d) {return d.rest_details;},
		function(d) {return d.review_number;},
		function(d) {return d.weighted_rating;},
		function(d) {return d.price_category;},
		function(d) {return "<a href="+d.url+">"+d.url+"</a>";}

		])

    		.sortBy(function (d) {
			
            		return d.weighted_rating;           
        		})
    		.order(d3.descending)
		.showGroups(false)
		.on('renderlet', function (table) {
		table.select('tr.dc-table-group').remove();
  		restMarkers.clearLayers();
  		allDim.top(Infinity).forEach( function (d) {
    		var lat = d.latitude;
		var lng = d.longitude;
    		var name = d.name;
		var group=d.food_category
		var rating=d.weighted_rating;
    		var marker = L.circleMarker([lat, lng]);
    		marker.bindPopup("<p>"+ "Name:" + name  + "</p>" +'\n'+
				"<p>"+ "Group:" + group  + "</p>" +'\n'+
				"<p>"+ "Rating:" + rating  + "</p>" +'\n');
    		restMarkers.addLayer(marker);
  		});
  		map.addLayer(restMarkers);
  		map.fitBounds(restMarkers.getBounds());

		});
		
  		


	var addXLabel = function(chartToUpdate, displayText) {
    	var textSelection = chartToUpdate.svg()
              	.append("text")
                .attr("class", "x-axis-label")
                .attr("text-anchor", "middle")
                .attr("x", chartToUpdate.width() / 2)
                .attr("y", chartToUpdate.height() - 2)
                .text(displayText);

    	var textDims = textSelection.node().getBBox();
    	var chartMargins = chartToUpdate.margins();

    // Dynamically adjust positioning after reading text dimension from DOM
    textSelection
        .attr("x", chartMargins.left + (chartToUpdate.width()
          - chartMargins.left - chartMargins.right) / 2)
        .attr("y", chartToUpdate.height() - Math.ceil(textDims.height) / 2);
  	};
  	var addYLabel = function(chartToUpdate, displayText) {
    	var textSelection = chartToUpdate.svg()
              	.append("text")
                .attr("class", "y-axis-label")
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .attr("x", -chartToUpdate.height() / 2)
                .attr("y", 10)
                .text(displayText);
    	var textDims = textSelection.node().getBBox();
    	var chartMargins = chartToUpdate.margins();

    	// Dynamically adjust positioning after reading text dimension from DOM
    	textSelection
        	.attr("x", -chartMargins.top - (chartToUpdate.height()
          	- chartMargins.top - chartMargins.bottom) / 2)
        	.attr("y", Math.max(Math.ceil(textDims.height), chartMargins.left
          	- Math.ceil(textDims.height) - 5));
  	};

  	// Bind addXLabel & addYlabel as callbacks to postRender
  	ratingchart.on("postRender", function(chart) {
    		addXLabel(chart, "Number of restaurants");
    		addYLabel(chart, "Weighthed rating out of 5");
  	});	

	update();
	
	dc.renderAll();
	
	



	

});

var ofs = 1, pag = 20;
var currentSize= 0;
var disp;

  function reset_to_first() {

	ofs=1, pag=20;
	update();
	restTable.redraw();
	}

  function update() {
      restTable.beginSlice(ofs-1);
      restTable.endSlice(ofs+pag);
      display();
  }

  function display() {
      disp = document.getElementsByClassName('filter-count')[0].innerHTML
	  currentSize = parseFloat(disp.replace(',',''));
      d3.select('#begin')
          .text(ofs);
      d3.select('#end')
          .text(ofs+pag-1>=currentSize ? currentSize :ofs+pag-1 );
      d3.select('#last')
          .attr('disabled', ofs-pag<0 ? 'true' : null);
      d3.select('#next')
          .attr('disabled', ofs+pag>=currentSize ? 'true' : null);
      d3.select('#reset_to_first')
          .attr('disabled', ofs-pag<0 ? 'true' : null);
      d3.select('#size').text(ndx.size());
  }

  function next() {
      ofs += pag;
      update();
      restTable.redraw();
  }
  function last() {
      ofs -= pag;
      update();
      restTable.redraw();
	
  }



function filter_reset(){

	disp = document.getElementsByClassName('filter-count')[0].innerHTML
	df= parseFloat(disp.replace(',',''));

	d3.select('#end').text(df<20 ? df :ofs+pag-1);
      	d3.select('#next')
          .attr('disabled', df<20 ? 'true' : null);
	
	
	ofs=1, pag=20;

	update();
	restTable.redraw();
	d3.select('#begin').text(df>=1 ? 1:0);


}


var price_ct= d3.select("#price-chart").on("click", function() {

filter_reset()
    	
	
})

var food_ct= d3.select("#food-chart").on("click", function() {

filter_reset()
    	
	
})


var rating_ct= d3.select("#rating-chart").on("click", function() {

filter_reset()
    	
	
})

function map_reset(){
map.setView([3.140853, 101.693207], 11);
}






