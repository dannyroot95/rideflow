var dataUser = localStorage.getItem("userData");
var user = dataUser ? JSON.parse(dataUser) : null;

function createDatatable() {
    $('#tb-data').DataTable({
        language: {
            "decimal": "",
            "emptyTable": "No hay información",
            "info": "Mostrando _TOTAL_ datos",
            "infoEmpty": "<b>No existen datos</b>",
            "infoFiltered": "(Filtrado de _MAX_ total datos)",
            "infoPostFix": "",
            "thousands": ",",
            "lengthMenu": "Mostrar _MENU_ datos",
            "loadingRecords": "Cargando...",
            "processing": "Procesando...",
            "search": "Buscar : ",
            "zeroRecords": "Sin resultados encontrados",
            "paginate": {
                "first": "Primero",
                "last": "Último",
                "next": "Siguiente",
                "previous": "Anterior"
            }
        },
        scrollY: '50vh',
        scrollX: true,
        sScrollXInner: "100%",
        scrollCollapse: true,
        destroy: true, // Permite destruir la tabla para reinicializarla
    });

    let button = `<button style="height:40px;" class="btn btn-dark" onclick="exportToExcel1()" 
    style="margin-left:10px;"><i class="bi bi-printer-fill"></i></button>`;
    $(button).appendTo('.dt-length');
}

function createDatatable2() {
    $('#tb-data2').DataTable({
        language: {
            "decimal": "",
            "emptyTable": "No hay información",
            "info": "Mostrando _TOTAL_ datos",
            "infoEmpty": "<b>No existen datos</b>",
            "infoFiltered": "(Filtrado de _MAX_ total datos)",
            "infoPostFix": "",
            "thousands": ",",
            "lengthMenu": "Mostrar _MENU_ datos",
            "loadingRecords": "Cargando...",
            "processing": "Procesando...",
            "search": "Buscar : ",
            "zeroRecords": "Sin resultados encontrados",
            "paginate": {
                "first": "Primero",
                "last": "Último",
                "next": "Siguiente",
                "previous": "Anterior"
            }
        },
        scrollY: '50vh',
        scrollX: true,
        sScrollXInner: "100%",
        scrollCollapse: true,
        destroy: true, // Permite destruir la tabla para reinicializarla
    });

    let button = `<button style="height:40px;" class="btn btn-dark" onclick="exportToExcel1()" 
    style="margin-left:10px;"><i class="bi bi-printer-fill"></i></button>`;
    $(button).appendTo('.dt-length2');
}

createDatatable();
createDatatable2();

const dataTable = $('#tb-data').DataTable();
dataTable.clear();
dataTable.draw(false);
document.getElementById("container").style.display = "block";
document.getElementById("container").style.visibility = "hidden";
dataTable.columns.adjust().draw(false);
document.getElementById("container").style.visibility = "visible";


const dataTable2 = $('#tb-data2').DataTable();
dataTable2.clear();
dataTable2.draw(false);
document.getElementById("container2").style.display = "block";
document.getElementById("container2").style.visibility = "hidden";
dataTable2.columns.adjust().draw(false);
document.getElementById("container2").style.visibility = "visible";


document.getElementById("loader").style.display = "none";