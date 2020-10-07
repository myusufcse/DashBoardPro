function createtable(moduleName) {
    function format(d) {
        return '<span class="errorpanel">' + d.log + '</span>';
      }
      $(document).ready(function () {
        var table = $('#example').DataTable({
          lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
          data: dataSet[moduleName],
          columns: [
            {
              className: 'details-control',
              orderable: false,
              data: null,
              defaultContent: ''
            },
            { title: "TEST NAME", data: "name" },
            { title: "CLASS NAME", data: "classname" },
            { title: "STATUS", data: "status" },
            { title: "EXECUTION TIME (in seconds)", data: "time" }
          ],
          "createdRow": function (row, data, dataIndex) {
            if (data.status == "FAILED") {
              $(row).addClass('red');
            }
            if (data.status == "SKIPPED") {
              $(row).addClass('yellow');
            }
          }
        });
  
        $('#example tbody').on('click', 'td.details-control', function () {
          var tr = $(this).closest('tr');
          var row = table.row(tr);
  
          if (row.child.isShown()) {
            row.child.hide();
            tr.removeClass('shown');
          } else {
            row.child(format(row.data())).show();
            tr.addClass('shown');
          }
        });
      });
}