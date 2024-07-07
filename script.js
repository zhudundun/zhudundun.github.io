document.addEventListener("DOMContentLoaded", function() {

	// Set the dimensions and margins of the graph
	const margin = {
			top: 20,
			right: 30,
			bottom: 40,
			left: 40
		},
		width = 800 - margin.left - margin.right,
		height = 600 - margin.top - margin.bottom;

	// Append the svg object to the body of the page
	const svg = d3.select("#chart")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", `translate(${margin.left},${margin.top})`);

	// Append a tooltip div to the body
	const tooltip = d3.select("body")
		.append("div")
		.style("position", "absolute")
		.style("background", "#f9f9f9")
		.style("padding", "5px")
		.style("border", "1px solid #d3d3d3")
		.style("border-radius", "5px")
		.style("pointer-events", "none")
		.style("opacity", 0);

	let allData;



	// Load data
	d3.tsv("state_market_tracker.tsv").then(data => {
		// Parse the date and convert homes_sold to number
		const parseDate = d3.timeParse("%Y-%m-%d");
		data.forEach(d => {
			d.period_begin = parseDate(d.period_begin);
			d.homes_sold = +d.homes_sold;
		});

		// Sort data by period_begin
		data.sort((a, b) => d3.ascending(a.period_begin, b.period_begin));

		// Filter data to only include dates from 2019 onwards
		allData = data.filter(d => d.period_begin >= new Date("2019-01-01"));

	});

	document.getElementById("submit-btn").addEventListener("click", function() {
		const selectedState = document.getElementById("state-select").value;
		const selectedYears = Array.from(document.querySelectorAll('#year-checkboxes input:checked')).map(cb => +cb.value);
		updateGraph(selectedState, selectedYears);
	});

	// Function to update the graph based on selected state
	function updateGraph(state, years) {
		let filteredData = allData;

        console.log("Initial filteredData count:", filteredData.length);



		if (state !== "all") {
			filteredData = filteredData.filter(d => d.state === state);
		}

		if (years.length > 0) {
			filteredData = filteredData.filter(d => years.includes(d.period_begin.getFullYear()));
		}

		// Clear previous SVG contents
		svg.selectAll("*").remove();



		

		// Color scale
		const color = d3.scaleOrdinal(d3.schemeCategory10).domain(years);

        const medianDataArray = [];


        years.forEach(year => {
			const yearData = filteredData.filter(d => d.period_begin.getFullYear() === year);
            console.log(`filteredData count for year ${year}:`, yearData.length);

			// Group data by period and calculate median homes_sold
			const dataByPeriod = d3.group(yearData, d => d.period_begin);
			const medianData = Array.from(dataByPeriod, ([period, values]) => {
				const medianHomesSold = d3.median(values, d => d.homes_sold);
				return {
					period_begin: period,
					homes_sold: medianHomesSold
				};
			});

            medianDataArray.push(...medianData);
        })
        const maxMedianHomesSold = d3.max(medianDataArray, d => d.homes_sold);



		years.forEach(year => {
			const yearData = filteredData.filter(d => d.period_begin.getFullYear() === year);
            console.log(`filteredData count for year ${year}:`, yearData.length);

			// Group data by period and calculate median homes_sold
			const dataByPeriod = d3.group(yearData, d => d.period_begin);
			const medianData = Array.from(dataByPeriod, ([period, values]) => {
				const medianHomesSold = d3.median(values, d => d.homes_sold);
				return {
					period_begin: period,
					homes_sold: medianHomesSold
				};
			});


            // X axis
            const x = d3.scaleTime()
                .domain(d3.extent(filteredData, d => d.period_begin))
                .range([0, width]);


            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).tickValues([]));



            // Y axis
            
            const y = d3.scaleLinear()
                // .domain([0, d3.max(filteredData, d => d.homes_sold)])
                .domain([0, maxMedianHomesSold])
                .range([height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y));


			// Line generator
			const line = d3.line()
				.x(d => x(d.period_begin))
				.y(d => y(d.homes_sold));


			// Append the path
			svg.append("path")
				.datum(medianData)
				.attr("fill", "none")
				.attr("stroke", "#69b3a2")
				.attr("stroke-width", 1.5)
				.attr("d", line);

			// Append circles to each data point
			svg.selectAll(`.data-point-${year}`)
				.data(medianData)
				.enter()
				.append("circle")
				.attr("class", `data-point-${year}`)
				.attr("cx", d => x(d.period_begin))
				.attr("cy", d => y(d.homes_sold))
				.attr("r", 4)
				.attr("fill", color(year))
				.on("mouseover", (event, d) => {
					tooltip.transition()
						.duration(200)
						.style("opacity", .9);
					tooltip.html(`Date: ${d3.timeFormat("%b %d, %Y")(d.period_begin)}<br>Median Homes Sold: ${d.homes_sold}`)
						.style("left", (event.pageX + 5) + "px")
						.style("top", (event.pageY - 28) + "px");
				})
				.on("mouseout", () => {
					tooltip.transition()
						.duration(500)
						.style("opacity", 0);
				});


		});

	}
	// Initial graph with all states
	updateGraph("all", []);


});










