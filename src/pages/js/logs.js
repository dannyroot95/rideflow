// Inicializa DataTable
let dataUser = localStorage.getItem("userData");
let user = dataUser ? JSON.parse(dataUser) : null;
var dataExcel = []

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
        order: [[0]],
    });

    let button = `<button class="btn btn-success" onclick="exportToExcel()" style="margin-left:10px;"><i class="bi bi-printer-fill"></i></button>`;
    $(button).appendTo('.dt-length');
}

createDatatable();


const dataTable = $('#tb-data').DataTable();
const logsCollection = db.collection('logs').orderBy('timestamp', 'desc');

// Aplica un filtro para obtener solo los usuarios cuyo typeUser sea 'association'
logsCollection.onSnapshot((snapshot) => {
    // Limpia el DataTable antes de añadir nuevos datos
    dataTable.clear();
    dataExcel = []

    snapshot.forEach((doc) => {
        const logsData = doc.data();

        // Añadir los datos a DataTable
        dataTable.row.add([
            formatoFechaDesdeTimestamp(logsData.timestamp)+' '+obtenerHoraMinutoDesdeTimestamp(logsData.timestamp),
            logsData.idUser,
            logsData.content,
            logsData.type
        ]);

        dataExcel.push({
            'Fecha':formatoFechaDesdeTimestamp(logsData.timestamp)+' '+obtenerHoraMinutoDesdeTimestamp(logsData.timestamp),
            'Id usuario':logsData.idUser,
            'Descripción':logsData.content,
            'Tipo':logsData.type
        })

    });

  

    // Dibuja el DataTable con los nuevos datos
    dataTable.draw(false);

    // Muestra el contenedor pero con visibilidad oculta
    document.getElementById("container").style.display = "block";
    document.getElementById("container").style.visibility = "hidden";

    // Ajusta las columnas del DataTable para evitar desalineaciones
    dataTable.columns.adjust().draw(false);
    document.getElementById("container").style.visibility = "visible";
    document.getElementById("loader").style.display = "none";

}, (error) => {
    console.error("Error al obtener documentos: ", error);
});


function formatoFechaDesdeTimestamp(timestamp) {
    const fecha = new Date(timestamp);
    const dia = String(fecha.getDate()).padStart(2, '0'); // Obtiene el día y lo formatea
    const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Obtiene el mes y lo formatea
    const anio = fecha.getFullYear(); // Obtiene el año

    return `${dia}/${mes}/${anio}`; // Devuelve la fecha en formato dd/mm/yyyy
}

// Función para obtener la hora y minutos desde un timestamp
function obtenerHoraMinutoDesdeTimestamp(timestamp) {
    const fecha = new Date(timestamp);
    const horas = String(fecha.getHours()).padStart(2, '0'); // Obtiene las horas y las formatea
    const minutos = String(fecha.getMinutes()).padStart(2, '0'); // Obtiene los minutos y los formatea

    return `${horas}:${minutos}`; // Devuelve la hora en formato HH:mm
}


function exportToExcel(){

    Swal.fire({
        title: 'En breves se descargará el archivo!',
        timer: 2000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading()
        },
      })
  

    let xls = new XlsExport(dataExcel, 'logs');
    xls.exportToXLS('logs.xls')
  }