document.addEventListener("DOMContentLoaded", function() {

	// Set the dimensions and margins of the graph
	const margin = {
			top: 20,
			right: 20,
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
    .text("Housing Market Trends in the Post-Pandemic Era");

	// Add a subtitle to display the current plot
    const subtitle = svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 100) // Adjust the y position to place it below the title
        .attr("class", "subtitle-text")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("");


	// Append description paragraph
    const descriptionText = svg.append("text")
        .attr("x", (width/2 ))
        .attr("y", 50) // Adjust the y position to place it below the title
        .attr("class", "description-text")
        .attr("text-anchor", "middle")
		.style("font-size", "16px")
		.text("This chart illustrates how the pandemic reshaped the U.S. housing market");

	// descriptionText.append("tspan")
    //     .attr("x", (width / 2))
    //     .attr("dy", "1.2em")
    //     .text("This chart illustrates the housing market trends in the post-pandemic era, divided into two distinct periods. ");

	// descriptionText.append("tspan")
    //     .attr("x", (width / 2))
    //     .attr("dy", "1.2em")
    //     .text(" In the first period, the housing market heated up significantly, with single-family homes in particular experiencing a surge in demand as a direct impact of COVID-19. ");
	
	// descriptionText.append("tspan")
    //     .attr("x", (width / 2))
    //     .attr("dy", "1.2em")
    //     .text("In the second period, the market has been cooling down due to rising mortgage rates, a secondary effect of the economic policies implemented during the pandemic.");



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
	let currentPlotIndex = -1; // Track the current plot button index




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

	
	
	// Function to get the index of the plot button based on data-column
    function getPlotButtonIndex(dataColumn) {
        const plotButtons = document.querySelectorAll('.plot-btn');
        for (let i = 0; i < plotButtons.length; i++) {
            if (plotButtons[i].getAttribute('data-column') === dataColumn) {
                return i;
            }
        }
        return -1; // Return -1 if not found
    }
	
	// Event listener for plot buttons
	const plotButtons = document.querySelectorAll('.plot-btn');


    plotButtons.forEach(button => {
        button.addEventListener('click', function() {
			document.querySelectorAll('.plot-btn').forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            const column = this.getAttribute('data-column');
			const yoy = document.querySelector('#toggle-sequence').classList.contains('selected');
			console.log("Selected button data column:", column); // Print the selected button's data column
			// const selectedYears = Array.from(document.querySelectorAll('#year-checkboxes input:checked')).map(cb => +cb.value);
			const selectedYears = [2019, 2020, 2021, 2022, 2023, 2024];

			if (column === null)
			{
				// return if no column is selected
				return;
			}

			currentPlotIndex = getPlotButtonIndex(column); 
			console.log("currentPlotIndex:", currentPlotIndex);

			// currentPlotButton = this.getAttribute('data-column');


			// highlightYear = currentPlotButton === "homes_sold" ? 2024 : 2023;

			// if (currentPlotButton === "median_dom") {highlightYear = 2019;}
			// if (currentPlotButton === "inventory") {highlightYear = 2020;}
			// if (currentPlotButton === "median_sale_price") {highlightYear = 2021;}
			// if (currentPlotButton === "price_drops") {highlightYear = 2022;}
			// if (currentPlotButton === "homes_sold") {highlightYear = 2023;}



			// Turn off the toggle switch
            const toggleSwitch = document.getElementById('toggle-sequence');
            toggleSwitch.classList.remove('active');
            const sequence = false;


			// Reset the state drop-down to "all"
            const stateSelect = document.getElementById('state-select');
            stateSelect.value = "all";

			// Reset the state drop-down to "all"
            const typeSelect = document.getElementById('home-type-select');
            typeSelect.value = "all";

            updateGraph("all","all", selectedYears, column, yoy); // Initial state as "all" and no year filter
        });
    });

	 // Event listener for toggle button
	 document.getElementById('toggle-sequence').addEventListener('click', function() {
        this.classList.toggle('active');
        const yoy = this.classList.contains('active');
        const column = document.querySelector('.plot-btn.selected').getAttribute('data-column');
        console.log("Toggle sequence:", yoy); // Print the toggle state
		// const selectedYears = Array.from(document.querySelectorAll('#year-checkboxes input:checked')).map(cb => +cb.value);
		const selectedYears = [2019, 2020, 2021, 2022, 2023, 2024];
        updateGraph("all", "all", selectedYears, column, yoy); // Initial state as "all" and no year filter
    });

	

	document.getElementById('submit-btn').addEventListener("click", function() {
		const selectedState = document.getElementById("state-select").value;
		const selectedHome = document.getElementById("home-type-select").value;
		// const selectedYears = Array.from(document.querySelectorAll('#year-checkboxes input:checked')).map(cb => +cb.value);
		const selectedYears = [2019, 2020, 2021, 2022, 2023, 2024];
		const column = document.querySelector('.plot-btn.selected').getAttribute('data-column'); // Get the selected column
		const yoy = document.getElementById('toggle-sequence').classList.contains('active');

		updateGraph(selectedState, selectedHome, selectedYears, column, yoy);
	});

	// Event listener for the next scene button
	document.getElementById('next-scene-btn').addEventListener('click', function() {
		// Find the next plot button to simulate click
		 // Increment the plot button index
		 currentPlotIndex = (currentPlotIndex + 1) % plotButtons.length;
		 console.log("next:", currentPlotIndex);
		 plotButtons[currentPlotIndex].click(); // Simulate click on the next plot button
	});

	

	

	// Function to update the graph based on selected state
	function updateGraph(state, home_type, years, column, yoy) {
		let filteredData = allData;
		const chart_top_margin = 100;

		// Define the date for the vertical line
		const verticalLineDate1 = new Date("2020-02-01");				
		const verticalLineDate2 = new Date("2022-05-01");				
		
		// Define the annotations
		var annotations = [{
			note: { 
				label: "Start of COVID-19 pandemic",
				title: ""
			},
			x: -1000, // Will be set later based on x-axis scale
			y: 100, // Set appropriate y-coordinate
			dy: 10,
			dx: 50
		},
		{
			note: { 
				label: "Start of Interest Rate Increase",
				title: ""
			},
			x: -1000, // Will be set later based on x-axis scale
			y: 100, // Set appropriate y-coordinate
			dy: 10,
			dx: 80
		}];

		

        // console.log("Initial filteredData count:", filteredData.length);

		


		if (state !== "all") {
			filteredData = filteredData.filter(d => d.state === state);
		}
		if (home_type !== "all") {
			filteredData = filteredData.filter(d => d.property_type === home_type);
		}


		if (years.length > 0) {
			filteredData = filteredData.filter(d => years.includes(d.period_begin.getFullYear()));
		}

		// Clear previous SVG contents
		chartGroup.selectAll("*").remove();

		

		// Update subtitle
        if (column === 'homes_sold') {
			subtitle.text(`Currently showing: Number of Homes Sold`);
			descriptionText.text(`Though affordability is still an issue, increasing rates help bring the market back to more typical levels of activity and pricing.`);
			if (state==='all' && home_type==='all') {annotations.push(
				{
				  note: { label: "After 4 years in pandemic, the housing market is finally normalized to a state close to 2019" },
				  x: 1000,
				  y: 380,
				  dy: -20,
				  dx: 10,
				  subject: { radius: 50, radiusPadding: 10 },
				},
			);}
			  
			//   d3.annotation().annotations(annotationsColumn);
		} else if (column === 'median_dom') { 
			subtitle.text(`Currently showing: Median Days on the Market`);
			descriptionText.text(`With more people working remotely, there was a surge in demand for larger homes with home offices and outdoor spaces.`);
			if (state==='all' && home_type==='all') {annotations.push(
				{
				  note: { label: "2nd half of 2020, days on market didn't follow seasonal trend and the demand is high" },
				  x: 350,
				  y: 340,
				  dy: 40,
				  dx: 30,
				  subject: { radius: 50, radiusPadding: 10 },
				},
			);}
		} else if (column === 'inventory') {
			subtitle.text(`Currently showing: Inventory`);
			descriptionText.text(`The pandemic caused delays in construction due to lockdowns, labor shortages, and supply chain disruptions. This exacerbated the already low housing inventory`);
			if (state==='all' && home_type==='all') {annotations.push(
				{
				  note: { label: "2 years into pandemic, inventory reaches lowest point" },
				  x: 580,
				  y: 500,
				  dy: -10,
				  dx: -50,
				  subject: { radius: 50, radiusPadding: 10 },
				},
			);}
		} else if (column === 'price_drops') {
			subtitle.text(`Currently showing: Price Drops`);
			descriptionText.text(`Higher interest rates typically lead to a decrease in housing demand. With more expensive mortgages, fewer people are willing or able to purchase homes.`);
			if (state==='all' && home_type==='all') {annotations.push(
				{
				  note: { label: "interest rate increase effectively lowers housing price and cools the demand" },
				  x: 750,
				  y: 170,
				  dy: 170,
				  dx: 5,
				  subject: { radius: 50, radiusPadding: 10 },
				},
			);}
		}  else {
			subtitle.text(`Currently showing: Median Sale Price`);
			descriptionText.text(`The increased demand for housing, coupled with low inventory, led to a significant rise in home prices.`);
			if (state==='all' && home_type==='all') {annotations.push(
				{
				  note: { label: "The sale price experienced the fastest growth rate between the onset of the pandemic and the subsequent increase in interest rates" },
				  x: 580,
				  y: 300,
				  dy: 10,
				  dx: 10,
				  subject: { radius: 50, radiusPadding: 10 },
				},
			);}

		}


		

		// Color scale
		const color = d3.scaleOrdinal(d3.schemeCategory10)
		.domain(years);
		// .range(years.map(year => year === highlightYear ? d3.schemeCategory10[0] : '#d3d3d3'))
		

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
        const minMedianValue = d3.min(medianDataArray, d => d.value);


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
			const x = d3.scaleTime().range([0, width-40]);
			if (yoy === true) {
                x.domain([new Date(year, 0), new Date(year, 11)]);

				if ( count == 0 )
				{
					chartGroup.append("g")
					.attr("transform", `translate(0,${height})`)
					.call(d3.axisBottom(x)
						  .tickFormat(d3.timeFormat("%B"))  // Format ticks to show full month names
						  .ticks(d3.timeMonth.every(1)));
				}
				count++;
			} else {
				x.domain(d3.extent(filteredData, d => d.period_begin));
				chartGroup.append("g")
					.attr("transform", `translate(0,${height})`)
					.call(d3.axisBottom(x).tickValues([]));


				

				// if (year === 2020) {
				chartGroup.append("line")
					.attr("x1", x(verticalLineDate1))
					.attr("x2", x(verticalLineDate1))
					.attr("y1", chart_top_margin)
					.attr("y2", height)
					.attr("stroke", "grey")
					.attr("stroke-width", 2)
					.attr("stroke-dasharray", "4");

				annotations[0].x = x(verticalLineDate1);
				// }

				// if (year === 2022) {
				chartGroup.append("line")
					.attr("x1", x(verticalLineDate2))
					.attr("x2", x(verticalLineDate2))
					.attr("y1", chart_top_margin)
					.attr("y2", height)
					.attr("stroke", "grey")
					.attr("stroke-width", 2)
					.attr("stroke-dasharray", "4");

				annotations[1].x = x(verticalLineDate2);
				// }

				const makeAnnotations = d3.annotation()
                    .type(d3.annotationLabel)
                    .annotations(annotations);

                chartGroup.append("g")
                    .attr("class", "annotation-group")
                    .call(makeAnnotations);	
			}

           


            // Y axis
            
            const y = d3.scaleLinear()
                .domain([minMedianValue, maxMedianValue])
                .range([height, chart_top_margin]);
            chartGroup.append("g")
                .call(d3.axisLeft(y));

            // Add y-axis label
            chartGroup.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - 2*margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .text(`${column.replace('_', ' ')}`);

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
				.attr("d", line)
				.attr("stroke-dasharray", function() {
					const totalLength = this.getTotalLength();
					return totalLength + " " + totalLength;
				})
				.attr("stroke-dashoffset", function() {
					return this.getTotalLength();
				})
				.transition()
				.duration(2000)
				.attr("stroke-dashoffset", 0);

			// Append circles to each data point
			chartGroup.selectAll(`.data-point-${year}`)
				.data(medianData)
				.enter()
				.append("circle")
				.attr("class", `data-point-${year}`)
				.attr("cx", d => x(d.month))
                .attr("cy", d => y(d.value))
				.attr("r", 5)
				.attr("fill", color(year))
				.style("opacity", .5)
				.on("mouseover", (event, d) => {
					tooltip.transition()
						.duration(200)
						.style("opacity", .7);
					tooltip.html(`Date: ${d3.timeFormat("%b %d, %Y")(d.month)}<br> ${column.replace('_', ' ')}: ${d.value}`)
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
		.attr("transform", `translate(${margin.left-400}, ${margin.bottom+400 })`)
		.selectAll("g")
		.data(years)
		.enter().append("g")
		.attr("transform", (d, i) => `translate(${i * 65},0)`);

	legend.append("rect")
		.attr("x", width - 18)
		.attr("width", 18)
		.attr("height", 18)
		.attr("fill", color)
		.style("opacity", .7);

	legend.append("text")
		.attr("x", width - 24)
		.attr("y", 9)
		.attr("dy", "0.35em")
		.attr("text-anchor", "end")
		.text(d => d);

	}
	// Initial graph with all states
	// updateGraph("all", "all", [], "homes_sold", false);


});










