const dataset = "dataset/anage_data.txt";

const margin = { top: 20, bottom: 30, right: 20, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const chart1 = d3.select("#chart1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);


const chart2 = d3.select("#chart2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);


d3.tsv(dataset).then((data) => {

    data = data.filter(d => (d['Adult weight (g)'] > 1 && d['Female maturity (days)'] > 1 && d['Data quality'] != "questionable"));
    data.forEach( element => console.log(element['Common name']))
        

    const x = d3.scaleLog().domain([1, 100000000]).range([0, width]);
    const y = d3.scaleLog().domain([1, 100000]).range([height, 0]);


    const colour = d3.scaleOrdinal()
        .domain(["", "Mammalia", "Reptilia", "Amphibia"])
        .range(["00000000", "red", "green", "blue"]);

   

    chart1.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x)).call(g => g.select(".domain").remove());
    chart1.append("g").call(d3.axisLeft(y)).call(g => g.select(".domain").remove());

    const tip = chart1.append("text").attr("x",width - 150).attr("y", height - 20).attr("text-anchor", "right").style("font-family", "sans-serif").style("font-size", "10px").text("");

    chart1.append("g")
        .selectAll("dot")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d['Adult weight (g)']))
        .attr("cy", d => y(d['Female maturity (days)']))
        .attr("r", 3)
        .style("stroke", d => colour(d.Class))
        .style("stroke-opacity", 0.5)
        .style("stroke-weight", 5)
        .style("fill-opacity", "0")
        .on("mouseover", (e,d) => {
            tip.text(d["Common name"]);
            tip.style("opacity", 1);
        })
        .on("mouseout", () => tip.style("opacity", 0));


    chart2.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x));
    chart2.append("g").call(d3.axisLeft(y));
    chart2.append("g")
        .selectAll("dot")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d['Adult weight (g)']))
        .attr("cy", d => y(d['Female maturity (days)']))
        .attr("r", 3)
        .attr("stroke", "red")
        .style("fill-opacity", "0");

});
