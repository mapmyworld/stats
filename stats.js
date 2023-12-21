
var MAP_BASE = '';
//var MAP_BASE = 'http://localhost:8080';

var mapId = '/stats';

mmw._common.setType('demo');
//mmw._common.setType('none');

var map = mmw.map;

var headerEl = mmw._overlay.headerEl;
var rightheaderEl = mmw._overlay.rightheaderEl;
var rightbarEl = mmw._overlay.rightbarEl;
var bottombarEl = mmw._overlay.bottombarEl;

map.on('load',async function() {
	map.addSource('India', { 'type' : 'geojson', 'data' : '../stats/data/IND/geo/IND-ADM0.geojson'});
	var fillLayer = newFillLayer('India', 'khaki', .9);
	map.addLayer(fillLayer);
	var lineLayer = newLineLayer('India', 'white', 2);
	map.addLayer(lineLayer);
});

document.title = 'World Statistics Map';
document.getElementsByTagName('link')[0].href = MAP_BASE + mapId + '/img/mmw-stats2.png';

rightheaderEl.style.display = 'flex';
rightheaderEl.firstElementChild.src = MAP_BASE + mapId + '/img/mmw-stats2.png';
rightheaderEl.firstElementChild.style.height = '50px';
rightheaderEl.children[1].innerHTML = "WORLD STATISTICS";

bottombarEl.style.display = 'grid';
bottombarEl.style.height = ((map.getCanvas().clientHeight/2) + 50) + 'px';
bottombarEl.style.width = (map.getCanvas().clientWidth/2) +'px';
bottombarEl.parentElement.style.left = 'auto';
bottombarEl.parentElement.style.right = '0';

var xFormat = '%Y';

if(map.getCanvasContainer().offsetWidth < 640) {
	headerEl.style.width = '50px';
	headerEl.children[1].style.display = 'none';
	bottombarEl.style.width = (map.getCanvas().clientWidth - 60) +'px';
	xFormat = '%y';
}

var navEl = mmw._comp.createTab();
var showNavEL = mmw._comp.createTablink('Show me');
showNavEL.setAttribute('onclick','toggleNav(\'show\')');
navEl.append(showNavEL);
var tellNavEL = mmw._comp.createTablink('Talk to me');
tellNavEL.setAttribute('onclick','toggleNav(\'talk\')');
navEl.append(tellNavEL);
bottombarEl.append(navEl);

var bottombarContentEl = document.createElement('div');
bottombarContentEl.style['margin-left'] = '0px';
bottombarContentEl.style['margin-top'] = '0px';
bottombarEl.append(bottombarContentEl);

var bottombarContent2El = document.createElement('div');
bottombarContent2El.style['text-decoration'] = 'none';
bottombarEl.append(bottombarContent2El);

function toggleNav(navId) {
	if(navId == 'show') {
		mmw._comp.switchTab(navEl, 0);
		bottombarContentEl.style.display = 'grid';
		bottombarContent2El.style.display = 'none';
	} else {
		mmw._comp.switchTab(navEl, 1);
		bottombarContentEl.style.display = 'none';
		bottombarContent2El.style.display = 'grid';
		talkInEl.focus();
	}
}

toggleNav('show');

var stats = {
	'gdp' : ['GDP', 'Billon USD'], 
	'gdp-per-capita' : ['GDP Per Capita', 'USD'],

	'population': ['Population', 'Million People'],

	'inflation': ['Inflation', '% Annual Change'],
	'inflation-cpi': ['Inflation CPI', 'Annual Avg. CPI'],

	'revenue': ['Govt. Revenue', '% of GDP'],
	'expenditure': ['Govt. Expenditure', '% of GDP' ],
	'debt': ['Govt. Gross Debt', '% of GDP'],

	'import': ['Import Volume', '% Annual Change'],
	'export': ['Export Volume', '% Annual Change']
};

var statIds = Object.keys(stats);

//if(!navId) {
	
var tabEl = mmw._comp.createTab();
for(var i=0; i < statIds.length; i++) {
	var statId = statIds[i];
	var stat = stats[statId];
	var tablinkEL = mmw._comp.createTablink(stat[0]);
	tablinkEL.setAttribute('onclick','loadData(\''+statId+'\',\''+ stat[0]+'\',\''+stat[1]+'\')');
	tabEl.append(tablinkEL);
}

bottombarContentEl.append(tabEl);
mmw._comp.switchTab(tabEl, 0);

var visEl = document.createElement('div');
bottombarContentEl.append(visEl);

mmw._event.onCountrySelect(true, onSelect);
	
map.on('load',async function() {
	map.setPaintProperty('countries-boundary', 'line-opacity', 1);
	loadData("gdp", stats.gdp[0], stats.gdp[1]);
});

//}

var jsonData = {};
var jsonDataCache = {};

var lastSelectedFeatureName = 'India';
var currentStat = statIds[0];

var names = [];

async function loadData(statId, statName, statDesc) {
	
	if(!names[0]) {
		names = [lastSelectedFeatureName];
	}
	
	mmw._layer.highlightCountries(names);
	
	currentStat	= [statName, statDesc];
	jsonData = await fetchData(statId);
	
	generateChart(names);
}

function onSelect(e, selectedFeature) {
	var name = selectedFeature.properties.NAME;
	names = [ name ];
	
	if(e.originalEvent.ctrlKey && lastSelectedFeatureName != name) {
		names = [lastSelectedFeatureName, name];
	}
	lastSelectedFeatureName = name;

	mmw._layer.highlightCountries(names);
	generateChart(names);
	toggleNav('show');
}

function generateChart(names) {
	
	var datas = [];
	
	for(var i=0; i< names.length; i++) {
		datas.push(jsonData[names[i]]);
	}
	
	var columns = [];
	columns.push(['x', ...datas[0].xAxis ]);
	columns.push([names[0], ...datas[0].yAxis ]);
	if(names.length > 1) {
		columns.push([names[1], ...datas[1].yAxis ]);
	}
	
	const chart = c3.generate({
		
		bindto: visEl,

		size : {
			width : bottombarEl.clientWidth - 20,
			height : bottombarEl.clientHeight - 110,
		},
		legend: { show: false },
	
		data: {
			x : 'x',
			xFormat: '%d-%m-%Y',
			columns: columns,
			//type: 'bar',
			type: 'line',
		},
		
		axis: {
			x: {
				type: 'timeseries',
				tick: { format: xFormat }
			}
		}
		
	});
	
	var legend = document.createElement('div');
	legend.classList.add('legend');
	legend.style['margin-top'] = '10px';
	legend.style['margin-left'] = '15px';
	legend.innerHTML = (names.join(' vs ')) + '\'s ' + currentStat[0] + ' ( ' + currentStat[1] + ' )';
	visEl.prepend(legend);
}

async function fetchData(stat) {
	var jsonData = jsonDataCache[stat];
	if(!jsonData) {
		var data = await fetch(  '/stats/data/' + stat + '.json');
		jsonData = await data.json();
		jsonDataCache[stat] = jsonData;
	}
	return jsonData;
}

//if(navId == 'talk') {

var talkOutEl = document.createElement('div');
//talkOutEl.style.height = '225px';
talkOutEl.style.height = ((map.getCanvas().clientHeight/2) - 50) + 'px';
talkOutEl.style['overflow-x'] = 'hidden';
talkOutEl.setAttribute('readonly', true);
bottombarContent2El.append(talkOutEl);

var lastTalk = 'What is the GDP of India ?';
var nextTalk = '';

var talkInEl = document.createElement('input');
talkInEl.setAttribute('placeholder', 'What is the GDP of India ? | Tell me the inflation of China | | Let me know the population of Italy');
talkInEl.addEventListener('keyup', async function(e) {

	e.stopPropagation();

	if(e.keyCode == 13 ) {
		try {

		if(!talkInEl.value.trim()) {
			return;
		}

		lastTalk = talkInEl.value;
		talkInEl.value = '';

		talkOut('Me: ' + lastTalk, 'in');
		var talkEl = talkOut('Statina: ...', 'out');

		var out = await talkIn(lastTalk.toLowerCase());
		out = JSON.parse(out);

		if(out.intent == 'greeting') {
			talkOut('Statina: Hi ! I am Statina, I am here to help you with World Statistics', 'out', talkEl);
			return;
		} else if(out.intent == 'currentstat') {
			var stat = out.params.stat;
			var places = out.params.places;
			var place = '';
			if(places[0]) { place = places.join(' '); }

			if(stat && place) {

				jsonData = await fetchData(stat);

				var statTrend = jsonData[place];
				if(!statTrend) {
					place = await matchFuzzyPlaces(places);
					if(place) {
						statTrend = jsonData[place];
					}
				}

				if(statTrend) {
					var statValues = statTrend.yAxis;
					var statValue = statValues[statValues.length-1];
					var statTime = jsonData[place].xAxis;
					statTime = statTime[statTime.length-1].substr(6);

					talkOut('Statina: As of year ' + statTime + ', ' + place + '\'s estimated ' + stats[stat][0] + ' is ' +  statValue +  ' ' + stats[stat][1] + ', based of IMF.', 'out', talkEl);
					return;
				}
			}

		}

		talkOut('Statina: Can you please be more precise ?', 'out', talkEl);

		} catch(e) {
			console.log(e);
			talkOut('Statina: I am sorry ! I could not find that.', 'out', talkEl);
		}

	} else if(e.keyCode == 38 ) {
		nextTalk = talkInEl.value;
		talkInEl.value = lastTalk;
	} else if(e.keyCode == 40 ) {
		talkInEl.value = nextTalk;
	}

});

bottombarContent2El.append(talkInEl);

//}

function toTitleCase(word) {
	return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

async function talkIn(query) {
	var url = 'https://script.google.com/macros/s/AKfycby8bcvJ8YJIjMkeRhO1CSCLh8wQDv9VBWCRTjMzw8jkJABbbYzjPilDxUlk8hGlwQCg/exec';
	var out = await fetch(url, { method: 'POST', body: query });
	var outdata = await out.text();
	return outdata;
}

async function matchFuzzyPlaces(places) {
	var url = 'https://script.google.com/macros/s/AKfycbwVqMT7yfGC6b54E_aPwyzahE8tHFCRfXxOiyl_vb1dWDp5J948N4DfxCkTpQsdwF4J/exec';
	var out = await fetch(url, { method: 'POST', body: places.join(',') });
	var outdata = await out.text();
	return outdata;
}

function talkOut(text, inout, talkEl) {
	if(!talkEl) {
		talkEl = document.createElement('div');
		talkEl.classList.add('talk');
		talkEl.classList.add('talk'+inout);
		talkOutEl.append(talkEl);
	}
	talkEl.innerText = text;
	talkOutEl.scrollTo(0, talkOutEl.scrollHeight);
	return talkEl;
}
