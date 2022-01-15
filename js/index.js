const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;
const opacity = 0.5;

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
let lParam = 'gdp';
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

    d3.select('#p').on('change', function(){ 
        lParam = d3.select(this).property('value');
        updateLineChart();
    });
	
    d3.select('#range').on('input', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScattePlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScattePlot();
		updateBar();
    });

    d3.select('#x').on('change', function(){ 
        xParam = d3.select(this).property('value');
        updateScattePlot();
        updateBar();
    });

    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScattePlot();
        updateBar();
    });

    d3.select('#param').on('change', function(){ 
        param = d3.select(this).property('value');
        updateScattePlot();
        updateBar();
    });
	
	function updateLineChart(){
		/* Step 3: Line Chart
		helpful sources:
			https://www.d3-graph-gallery.com/graph/line_basic.html
		*/
        if (typeof selected != 'undefined') {
            d3.select('.country-name').text(selected);

            line_data = Object.entries(data.filter(d => d.country == selected)[0][lParam]).slice(0, 221)
            dates = line_data.map(d => +d[0])
            y_col = line_data.map(d => +d[1])

			// adjust x axis
			let min_dat = Math.min.apply(Math, dates)
			let max_dat = Math.max.apply(Math, dates)
            x.domain([min_dat, max_dat]);
            xLineAxis.call(d3.axisBottom(x));

			// adjust y axis
			let min_y_col = Math.min.apply(Math, y_col)
			let max_y_col = Math.max.apply(Math, y_col)
            y.domain([min_y_col, max_y_col]);
            yLineAxis.call(d3.axisLeft(y));
			
			// delete old one
            lineChart.select('.lineData').remove();

			// draw new one
            lineChart.append("path")
                .datum(line_data)
                .attr("class", "lineData")
                .attr("fill", "none")
                .attr("stroke", "blue")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
					.x(d => {return x(+d[0])})
					.y(d => y(+d[1]))
					)
        }
    }
	
    function updateBar(){
		/* Step 3: Bar Chart
		helpful sources:
			https://www.tutorialsteacher.com/d3js/create-bar-chart-using-d3js
		*/
		
		// calculate average values for regions
		let regs = d3.set(data.map(d => d.region)).values();
        let regs_avg = regs.map(r => {
            return {
				"region": r,
				"avg": d3.mean(data.filter(d => d.region == r)
					.flatMap(d => d[param][year]))
            }
        });
		
		// adjust axes
        xBar.domain(regs);
        xBarAxis.call(d3.axisBottom(xBar));
        yBar.domain([0, d3.max(regs_avg.map(d => d.avg))]);
        yBarAxis.call(d3.axisLeft(yBar));

        // clean old ones
		barChart.selectAll("rect").remove();

		// create bar chart
        barChart.selectAll("rect")
            .data(regs_avg)
            .enter()
			.append("rect")
			.attr("x", d => xBar(d.region))
			.attr("y", d => yBar(d.avg))
			.attr("height", d => height - (margin + yBar(d.avg)))
			.attr("width", xBar.bandwidth())
			.attr("fill", d => colorScale(d.region))
			.attr("region", d => d.region)
			.on("click", function(d) {
					// restore old opacity in case it was changed
                    scatterPlot.selectAll('circle').style('opacity', 0.85)
					
					// change opacity for others
                    scatterPlot.selectAll('circle')
                        .filter(d => d.region != d3.select(this).attr('region'))
						.style('opacity', 0)
					
					// update columns opacity
					barChart.selectAll('rect').attr('opacity', opacity)
                    d3.select(this).attr('opacity', 1)
					}
				)
		
        return;
    }

    function updateScattePlot(){
		/* Step 1: Bubble Chart
		helpful sources: 			
			https://www.educative.io/edpresso/how-to-create-a-bubble-chart-using-d3
			https://www.d3-graph-gallery.com/graph/custom_axis.html
		*/ 
		
		// determination of axes scale
		let x_arr = data.map(d=> Number(d[xParam][year]));
		let min_x = Math.min.apply(Math, x_arr)
		let max_x = Math.max.apply(Math, x_arr)
        x.domain([min_x, max_x]);
		xAxis.call(d3.axisBottom(x));
		
		let y_arr = data.map(d => Number(d[yParam][year]));
		let min_y = Math.min.apply(Math, y_arr)
		let max_y = Math.max.apply(Math, y_arr)
        y.domain([min_y, max_y]);
		yAxis.call(d3.axisLeft(y));
		
		var rValues = data.map(d => Number(d[rParam][year]));
		var r_arr = data.map(d => Number(d[rParam][year]));
		var min_r = Math.min.apply(Math, r_arr)
		var max_r = Math.max.apply(Math, r_arr)
		radiusScale.domain([min_r, max_r]);
		
		// clean old ones before plotting new ones
		scatterPlot.selectAll('circle').remove();
		
		scatterPlot.selectAll("circle")
		  .data(data).enter()
		  .append("circle")
		  .attr("cx", d => x(d[xParam][year]))
		  .attr("cy", d => y(d[yParam][year]))
		  .attr("r", d => radiusScale(d[rParam][year]))
		  .attr("fill", d => colorScale(d["region"]))
		  .attr("region", d => d.region)
		  .attr('country', d => d.country)
		  .on('click', function(d) {
			// set style for all circles
			scatterPlot.selectAll('circle').style('opacity', opacity).attr('stroke-width', 1)
			
			// highlight the chosen one 
			d3.select(this).style('opacity', 1).attr('stroke-width', 2)
			d3.select(this).raise();
			
			selected = d3.select(this).attr('country');
			updateBar();
			updateLineChart();
			});
		
        return; 
     }

    updateBar();
    updateScattePlot();
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