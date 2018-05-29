// Nice looking colors - no reason to buck the trend
// @v4 scales now have a flattened naming scheme
var colors = ['#404041', '#00B5EF', '#65BD60', '#DA1A32', '#F9C606'];
var fillColor = d3.scaleOrdinal()
.domain(['Borders & Counternarcotics', 'Development', 'Justice and Rule of Law', 'Law Enforcement', 'Violence Prevention'])
.range(['#404041', '#00B5EF', '#65BD60', '#DA1A32', '#F9C606']);

export {fillColor, colors};