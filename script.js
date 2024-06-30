// Set the dimensions and margins of the graph
const margin = {top: 20, right: 30, bottom: 40, left: 40},
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

// Append the svg object to the body of the page
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


// Load data
d3.tsv("state_market_tracker.tsv").then(data => {
    // Parse the date and convert homes_sold to number
    const parseDate = d3.timeParse("%Y-%m-%d");
    data.forEach(d => {
        d.period_begin = parseDate(d.period_begin);
        d.homes_sold = +d.homes_sold;
    });

 // Group data by period and calculate median homes_sold
 const dataByPeriod = d3.group(data, d => d.period_begin);
 const medianData = Array.from(dataByPeriod, ([period, values]) => {
     const medianHomesSold = d3.median(values, d => d.homes_sold);
     return { period_begin: period, homes_sold: medianHomesSold };
 });

    // X axis
    const x = d3.scaleTime()
        .domain(d3.extent(medianData, d => d.period_begin))
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b %Y")));

    // Y axis
    const y = d3.scaleLinear()
        .domain([0, d3.max(medianData, d => d.homes_sold)])
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

    // Annotations (optional)
    const highestValueIndex = d3.scan(medianData, (a, b) => b.homes_sold - a.homes_sold);
    const annotations = [
        {
            note: {
                label: "Highest Homes Sold",
                title: d3.timeFormat("%b %Y")(medianData[highestValueIndex].period_begin)
            },
            x: x(medianData[highestValueIndex].period_begin),
            y: y(d3.max(medianData, d => d.homes_sold)),
            dy: -30,
            dx: 50
        }
    ];

    const makeAnnotations = d3.annotation()
        .annotations(annotations);

    svg.append("g")
        .call(makeAnnotations);
});


