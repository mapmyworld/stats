
var MAP_BASE = '';
var mapId = '/stats';

mmw._common.setType('demo');
//mmw._common.setType('none');

var map = mmw.map;

var headerEl = mmw._overlay.headerEl;
var rightheaderEl = mmw._overlay.rightheaderEl;
var rightbarEl = mmw._overlay.rightbarEl;
var bottombarEl = mmw._overlay.bottombarEl;

document.title = 'World Statistics Map';
document.getElementsByTagName('link')[0].href = MAP_BASE + mapId + '/img/mmw-stats2.png';

rightheaderEl.style.display = 'flex';
rightheaderEl.firstElementChild.src = MAP_BASE + mapId + '/img/mmw-stats2.png';
rightheaderEl.firstElementChild.style.height = '50px';
rightheaderEl.children[1].innerHTML = "WORLD STATISTICS";
rightheaderEl.setAttribute('onclick','');

var xFormat = '%Y';

if(map.getCanvasContainer().offsetWidth < 640) {
	headerEl.style.width = '50px';
	headerEl.children[1].style.display = 'none';
	xFormat = '%y';
}

var stats = [ 


['gdp', 'GDP', 'Billon USD' ], 
['gdp-capita', 'GDP Per Capita', 'USD'],

['population', 'Population', 'Million People' ],

['inflation', 'Inflation', 'Annual Change %' ],
['inflation-cpi', 'Inflation CPI', 'Annual Avg. CPI'] ,

['revenue', 'Govt. Revenue', 'GDP %'],
['expenditure', 'Govt. Expenditure', 'GDP %' ],
['debt', 'Govt. Gross Debt', ' GDP %'],

['import', 'Import Volume', 'Annual Change %'],
['export', 'Export Volume', 'Annual Change %']

 ];

bottombarEl.style.display = 'grid';
bottombarEl.style.height = (map.getCanvas().clientHeight/2) + 'px';
bottombarEl.style.width = (map.getCanvas().clientWidth - 70) +'px';
bottombarEl.parentElement.style.left = 'auto';
bottombarEl.parentElement.style.right = '0';

var tabEl = mmw._comp.createTab();
for(var i=0; i < stats.length; i++) {
	var stat = stats[i];
	var tablinkEL = mmw._comp.createTablink(stat[1]);
	tablinkEL.setAttribute('onclick','loadData(\''+stat[0]+'\',\''+ stat[1]+'\',\''+stat[2]+'\')');
	tabEl.append(tablinkEL);
}
bottombarEl.append(tabEl);
mmw._comp.switchTab(tabEl, 0);

var bottombarContentEl = document.createElement('div');
bottombarEl.append(bottombarContentEl);

mmw._event.onCountrySelect(true, onSelect);
	
map.on('load',async function() {
	map.setPaintProperty('countries-boundary', 'line-opacity', 1);
	loadData(stats[0][0], stats[0][1], stats[0][2]);
});

var jsonData = {};

var lastSelectedFeatureName = 'India';
var currentStat = stats[0];

var names = [];

async function loadData(statId, statName, statDesc) {
	
	if(!names[0]) {
		names = [lastSelectedFeatureName];
	}
	
	mmw._layer.highlightCountries(names);
	
	currentStat	= [statId, statName, statDesc];
	var data = await fetch(MAP_BASE + mapId + '/data/' + statId + '.json');
	jsonData = await data.json();
	
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
	//var data = jsonData[clickedFeature.properties.NAME] || jsonData[clickedFeature.properties.ADM0_A3] || 0;
	generateChart(names);
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
		
		bindto: bottombarContentEl,

		size : {
			width : bottombarEl.clientWidth - 10,
			height : bottombarEl.clientHeight - 80,
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
	legend.innerHTML = (names.join(' vs ')) + '\'s ' + currentStat[1] + ' ( ' + currentStat[2] + ' )';
	bottombarContentEl.prepend(legend);
}