document.addEventListener("DOMContentLoaded", function() {

	// Set the dimensions and margins of the graph
	const margin = {
			top: 20,
			right: 30,
			bottom: 60,
			left: 40
		},
		width = 1200 - margin.left - margin.right,
		height = 600 - margin.top - margin.bottom;

	// Append the svg object to the body of the page
	const svg = d3.select("#chart")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", `translate(${margin.left},${margin.top})`);

    // Append a group element to hold the chart contents
    const chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add a title to the chart
    svg.append("text")
    .attr("x", (width / 2))             
    .attr("y", 0)
    .attr("text-anchor", "middle")  
    .style("font-size", "24px") 
    .text("Post Pandemic Era Housing Market");


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
			d.off_market_in_two_weeks = +d.off_market_in_two_weeks;
            d.month = d.period_begin.getMonth(); // Extract month

		});

		// Sort data by period_begin
		data.sort((a, b) => d3.ascending(a.period_begin, b.period_begin));

		// Filter data to only include dates from 2019 onwards
		allData = data.filter(d => d.period_begin >= new Date("2019-01-01"));

	});

	// Event listener for plot buttons
    document.querySelectorAll('.plot-btn').forEach(button => {
        button.addEventListener('click', function() {
			document.querySelectorAll('.plot-btn').forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            const column = this.getAttribute('data-column');
			console.log("Selected button data column:", column); // Print the selected button's data column
            updateGraph("all", [], column); // Initial state as "all" and no year filter
        });
    });

	document.getElementById("submit-btn").addEventListener("click", function() {
		const selectedState = document.getElementById("state-select").value;
		const selectedYears = Array.from(document.querySelectorAll('#year-checkboxes input:checked')).map(cb => +cb.value);
		const column = document.querySelector('.plot-btn.selected').getAttribute('data-column'); // Get the selected column
		updateGraph(selectedState, selectedYears, column);
	});

	// Function to update the graph based on selected state
	function updateGraph(state, years, column) {
		let filteredData = allData;

        // console.log("Initial filteredData count:", filteredData.length);



		if (state !== "all") {
			filteredData = filteredData.filter(d => d.state === state);
		}

		if (years.length > 0) {
			filteredData = filteredData.filter(d => years.includes(d.period_begin.getFullYear()));
		}

		// Clear previous SVG contents
		chartGroup.selectAll("*").remove();



		

		// Color scale
		const color = d3.scaleOrdinal(d3.schemeCategory10).domain(years);

        const medianDataArray = [];

        let count = 0;
        years.forEach(year => {
			const yearData = filteredData.filter(d => d.period_begin.getFullYear() === year);
            console.log(`filteredData count for year ${year}:`, yearData.length);

			// Group data by period and calculate median homes_sold
			const dataByPeriod = d3.group(yearData, d => d.period_begin);
			const medianData = Array.from(dataByPeriod, ([period, values]) => {
				const medianValue = d3.median(values, d => d[column]);
				return {
					period_begin: period,
					value: medianValue
				};
			});

            medianDataArray.push(...medianData);
        })
        const maxMedianValue = d3.max(medianDataArray, d => d.value);



		years.forEach(year => {
			const yearData = filteredData.filter(d => d.period_begin.getFullYear() === year);
            console.log(`filteredData count for year ${year}:`, yearData.length);

			// Group data by period and calculate median homes_sold
            const dataByMonth = d3.group(yearData, d => d.month);


			const medianData = Array.from(dataByMonth, ([month, values]) => {
				const medianValue = d3.median(values, d => d[column]);

                return { 
					month: new Date(year, month), 
					value: medianValue 
				}; // Use a constant year for x-axis
       
			});


            // X axis
            const x = d3.scaleTime()
                .domain([new Date(year, 0), new Date(year, 11)])
                .range([0, width-40]);

            if ( count == 0 )
            {
                chartGroup.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x)
                      .tickFormat(d3.timeFormat("%B"))  // Format ticks to show full month names
                      .ticks(d3.timeMonth.every(1)));
            }
            count++;


            // Y axis
            
            const y = d3.scaleLinear()
                .domain([0, maxMedianValue])
                .range([height, 0]);
            chartGroup.append("g")
                .call(d3.axisLeft(y));

            // Add y-axis label
            chartGroup.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - 1.5*margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .text(`Median ${column.replace('_', ' ')}`);

            chartGroup.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Month");




			// Line generator
			const line = d3.line()
				.x(d => x(d.month))
                .y(d => y(d.value));


			// Append the path
			chartGroup.append("path")
				.datum(medianData)
				.attr("fill", "none")
				.attr("stroke", color(year))
				.attr("stroke-width", 2)
				.attr("d", line);

			// Append circles to each data point
			chartGroup.selectAll(`.data-point-${year}`)
				.data(medianData)
				.enter()
				.append("circle")
				.attr("class", `data-point-${year}`)
				.attr("cx", d => x(d.month))
                .attr("cy", d => y(d.value))
				.attr("r", 4)
				.attr("fill", color(year))
				.on("mouseover", (event, d) => {
					tooltip.transition()
						.duration(200)
						.style("opacity", .9);
					tooltip.html(`Date: ${d3.timeFormat("%b %d, %Y")(d.month)}<br>Median ${column.replace('_', ' ')}: ${d.value}`)
                        .style("left", (event.pageX + 5) + "px")
						.style("top", (event.pageY - 28) + "px");
				})
				.on("mouseout", () => {
					tooltip.transition()
						.duration(500)
						.style("opacity", 0);
				});


		});

	// Add legend
	const legend = chartGroup.append("g")
		.attr("class", "legend")
		.attr("transform", `translate(${margin.left-400}, ${margin.top -20})`)
		.selectAll("g")
		.data(years)
		.enter().append("g")
		.attr("transform", (d, i) => `translate(${i * 80},0)`);

	legend.append("rect")
		.attr("x", width - 18)
		.attr("width", 18)
		.attr("height", 18)
		.attr("fill", color);

	legend.append("text")
		.attr("x", width - 24)
		.attr("y", 9)
		.attr("dy", "0.35em")
		.attr("text-anchor", "end")
		.text(d => d);

	}
	// Initial graph with all states
	updateGraph("all", [], "homes_sold");


});










