const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);
        
let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected;


const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {
    colorScale.domain(d3.set(data.map(d=>d.region)).values());
    
    d3.select('#range').on('change', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#x').on('change', function(){
        xParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#param').on('change', function(){ 
        param = d3.select(this).property('value');
        updateBar();
    });

    function updateBar(){
        const barData = d3.nest()
            .key(d => d.region)
            .rollup(leaves => {
                return d3.mean(leaves.map(d=> Number(d[param][year])))
            })
            .entries(data);
        console.log(barData);
        
        xBar.domain(barData.map(d => d.key));
        yBar.domain(d3.extent(barData.map(d => d.value)));
        const selection = barChart.selectAll('rect').data(barData);

        const bars = selection.enter().append('rect');

        selection.merge(bars)
            .attr('x', d => xBar(d.key))
            .attr('y', d => yBar(d.value))
            .attr('fill', d => colorScale(d.key))
            .attr('height', d => height - yBar(d.value))
            .attr('width', 100);
    }

    function updateScatterPlot(){
        const xValues = data.map(d => Number(d[xParam][year])); // массив
        const xDomain = d3.extent(xValues); // [min, max]
        x.domain(xDomain); // [min, max] по xParam

        const yValues = data.map(d => Number(d[yParam][year])); // массив
        const yDomain = d3.extent(yValues); // [min, max]
        y.domain(yDomain); // [min, max] по xParam

        const selection = scatterPlot.selectAll('circle').data(data); 
        // [] [DATA1, DATA2]
        // enter: [circle, circle]
        // update: []

        // [circle, circle] [DATA1, DATA2]
        // enter: []
        // update: [circle, circle]

        var rValues = data.map(d => Number(d[rParam][year]));
		var r_arr = data.map(d => Number(d[rParam][year]));
		var min_r = Math.min.apply(Math, r_arr)
		var max_r = Math.max.apply(Math, r_arr)
		radiusScale.domain([min_r, max_r]);
            
        const circles = selection.enter()
                .append('circle'); /*создаем элементы*/

        selection.merge(circles)
                //.attr('r', 50)
                .attr("r", d => radiusScale(d[rParam][year]))
                .attr('cx', d => x(Number(d[xParam][year])))
                .attr('cy', d => y(Number(d[yParam][year])))
                .attr('fill', d => colorScale(d.region));
    }

    updateBar();
    updateScatterPlot();
});


async function loadData() {
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}