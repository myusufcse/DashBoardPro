function initializeCanvas(id, pass, fail, skip) {
    //console.log("initialize canvas for : " + id);
    data = {
        datasets: [{
            backgroundColor: ['#006d77', '#e76f51', '#e9c46a'],
            borderColor: '#fff',
            hoverBorderWidth: '1px',
            data: [pass, fail, skip]
        }],
        labels: ['PASSED', 'FAILED', 'SKIPPED']
    };
    var ctx = document.getElementById(id).getContext('2d');
    var myPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            title: {
                display: false,
                text: 'Module report'
            },
            tooltips: {
                mode: 'index',
                intersect: false
            },
            responsive: true,
            legend: {
                display: false,
                labels: {
                    fontColor: 'rgb(255, 99, 132)'
                }
            }
        }
    });
}

function moduleColorState(pass, fail, skip, date) {
    max_val = 0;
    var executiondate = date.split('T')[0];
    var today = new Date().toISOString().split('T')[0];
    if (today == executiondate) {
        if (fail === 0) {
            max_val = 'pass pass-stripe';
        } else {
            max_val = 'fail fail-stripe';
        }
    } else {
        if (fail === 0) {
            max_val = 'pass';
        } else {
            max_val = 'fail';
        }
    }


    return max_val;
}