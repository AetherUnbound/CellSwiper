months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

$(function() {
    $.get('/all-batch-info').done(function(data) {
        batch_dict = {}
        let date_reg = /^(\d{4})-(\d{2})/;
        for (let batch of data) {
            let reg_match = date_reg.exec(batch.date_added);
            let year = reg_match[1]; 
            let month = reg_match[2];
            if (!batch_dict[year]) {
                batch_dict[year] = {};
            }
            if (!batch_dict[year][month]) {
                batch_dict[year][month] = [];
            }
            batch_dict[year][month].push(batch);
        }
        let batch_list = "<ul class='list-group'>";
        for (let y in batch_dict) {
            batch_list += makeYear(y, batch_dict[y]);
        }
        $("#batch-wrapper").html(batch_list + "</ul>");
    });
});

function makeYear(year, obj) {
    let year_html = `<li data-toggle="collapse" data-target="#${year}-list" 
    class="year list-group-item collapsed">
    <span class="expand-glyph glyphicon glyphicon-chevron-down"></span>2017</li>
    <div data-year="${year}" id="${year}-list" class="collapse year-list">`;
    for (let m in obj) {
        year_html += makeMonth(year, parseInt(m) - 1, obj[m]);
    }
    year_html += "</div>";
    return year_html;

}

function makeMonth(year, month, month_list) {
    let month_html = `<li data-toggle="collapse" data-target="#${year}-${month}-list" class="month list-group-item collapsed">
    <span class="expand-glyph glyphicon glyphicon-chevron-down"></span>${months[month]}</li>
    <div id="${year}-${month}-list" class="collapse month-list">`;
    for (let b of month_list) {
        month_html += `<li class="batch list-group-item row">
        <span class="col-xs-2">${b.batch_name}</span><small class="col-xs-offset-1 col-xs-3">${b.original_dir}</small>
        <button onclick="startBatch(${b.id})" class="btn btn-primary col-xs-offset-1">Start</button></li>`
    }
    month_html += '</div>';
    return month_html;
}

function startBatch(id) {
    console.log("Starting batch " + id);
}