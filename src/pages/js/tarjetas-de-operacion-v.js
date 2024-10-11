var dataUser = localStorage.getItem("userData");
var user = dataUser ? JSON.parse(dataUser) : null;

// Inicializa DataTable
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

}

createDatatable();

const dataTable = $('#tb-data').DataTable();
const usersCollection = db.collection('cards');

usersCollection.onSnapshot((snapshot) => {
    // Limpia el DataTable antes de añadir nuevos datos
    dataTable.clear();

    snapshot.forEach((doc) => {
        const fileData = doc.data();
        const details = `
            <center>
                <button class="btn btn-light" style="background-color:#C70039;color:white;" 
                    data-user='${JSON.stringify(fileData)}' onclick="showDetails(this)">
                    Ver
                </button>
            </center>
        `;
        
        // Añadir los datos a DataTable
        dataTable.row.add([
            details,
            fileData.name,
            fileData.dni,
            fileData.numCardOperation,
            getStatus(fileData.dateGenerated,fileData.expiryDate),
            fileData.dateGenerated,
            fileData.expiryDate
        ]);
    });

    // Dibuja el DataTable con los nuevos datos y ajusta la visibilidad del contenedor
    dataTable.draw(false);
    toggleContainerVisibility(true);
    dataTable.columns.adjust().draw(false);
    hideLoader();
}, (error) => {
    console.error("Error al obtener documentos: ", error);
});

// Muestra el modal con los detalles del archivo seleccionado
function showDetails(button) {
    const fileData = JSON.parse(button.getAttribute('data-user'));

    $('#details').modal('show');
    updateDetailsModal(fileData);
}

// Actualiza los campos del modal con los datos del archivo
function updateDetailsModal(fileData) {
    // Configuración inicial de jsPDF con tamaño personalizado para carnet que se dobla
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [90, 132] // Tamaño ampliado para permitir doblar
    });

    var image = new Image();
    image.src = "/images/t-operacion.png"; // Asegúrate de que la ruta es accesible
    image.onload = function() {


        var canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, fileData.id, function (error) {
            if (error) console.error('Error al crear QR: ', error);
            var imgData = canvas.toDataURL('image/png');
       // Posicionar la imagen para que esté centrada en la parte superior de la tarjeta
       const imgWidth = 90; // El ancho de la imagen debe cubrir el ancho del PDF
       const imgHeight = 132; // Altura de la imagen ajustada para cubrir la mitad superior
       const x = 0;
       const y = 0;

       // Añadir la imagen cuando esté completamente cargada

       doc.addImage(image, 'PNG', x, y, imgWidth, imgHeight);
       doc.setFontSize(7);
       doc.setTextColor("#FC0000");
       doc.text('N° '+fileData.numCardOperation,35.5,25);
       doc.setFontSize(6);
       doc.setTextColor("#535353");

       doc.text(fileData.nameAssociation,4,33);
       doc.text((fileData.plate).toUpperCase(),4,41.3);
       doc.text(fileData.yearBuild,4,48.6);
       doc.text((fileData.numSerieVehicle).toUpperCase(),4,56.5);
       doc.text((fileData.numEngine).toUpperCase(),4,64);

       doc.text((fileData.numResolution).toUpperCase(),52.5,35);
       doc.text((fileData.brand + ' - ' +fileData.model).toUpperCase(),52.5,42.5);
       doc.text((fileData.color).toUpperCase(),52.5,48.5);
       doc.text((fileData.category).toUpperCase(),52.5,55);
       doc.text(fileData.dateGenerated,52,61);
       doc.text(fileData.expiryDate,71.5,61);

       doc.text((fileData.codeVest).toUpperCase(),29,88.5);
       doc.addImage(imgData, 'PNG', 52.5, 82, 12, 12); // Ajusta las coordenadas y tamaño según necesites

       doc.setFontSize(5);
       doc.text(fileData.yearBuild+fileData.dni,66,88.5);
       doc.text(formatDateToDDMMYYYY(Date.now())+' '+obtenerHoraMinutoDesdeTimestamp(Date.now()),66,94.5);

       // Exportar el PDF a un blob
       const pdfBlob = doc.output('blob');
       // Crear un URL para el blob
       const url = URL.createObjectURL(pdfBlob);
       // Mostrar el PDF en el iframe del modal
       document.getElementById('pdfFrame').src = url;
       // Mostrar el modal
       $('#details').modal('show');
            // Añadir la imagen QR al PDF

        });
    };
    image.onerror = function() {
        console.error("Error loading the image.");
    };
}

// Genera la tarjeta de operación
// Genera la tarjeta de operación y guarda los datos en la colección 'cards'


// Función para mostrar y ocultar el contenedor
function toggleContainerVisibility(isVisible) {
    const container = document.getElementById("container");
    container.style.display = isVisible ? "block" : "none";
    container.style.visibility = isVisible ? "visible" : "hidden";
}

// Oculta el loader después de que los datos se hayan cargado
function hideLoader() {
    document.getElementById("loader").style.display = "none";
}


function enable(){
    document.getElementById("btn-close-modal").style.display = "block"
    document.getElementById("btnCorrect").style.display = "block"
    document.getElementById("loader2").style.display = "none"
}

function disable(){
    document.getElementById("btn-close-modal").style.display = "none"
    document.getElementById("btnCorrect").style.display = "none"
    document.getElementById("loader2").style.display = "block"
}

function isLetter(event) {
    const charCode = event.which || event.keyCode;
    // Permitir letras y teclas especiales como la barra espaciadora y las teclas de control
    return (charCode >= 65 && charCode <= 90) || // Letras mayúsculas
           (charCode >= 97 && charCode <= 122) || // Letras minúsculas
           charCode === 32 || // Espacio
           charCode === 8 || // Retroceso
           charCode === 46 || // Suprimir
           charCode === 9; // Tabulador
}

function validateLetters(input) {
    // Reemplaza cualquier carácter que no sea una letra o espacio
    input.value = input.value.toUpperCase().replace(/[^a-zA-Z\s]/g, '');
}

function getStatus(dateGenerated, expiryDate) {
    const genDateParts = dateGenerated.split('/');
    const expDateParts = expiryDate.split('/');

    const genDate = new Date(genDateParts[2], genDateParts[1] - 1, genDateParts[0]);
    const expDate = new Date(expDateParts[2], expDateParts[1] - 1, expDateParts[0]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Normalizar la fecha de hoy para eliminar la hora

    if (today >= genDate && today <= expDate) {
        return `<span class="status-vigente">Vigente</span>`;
    } else {
        return `<span class="status-no-vigente">Caducado</span>`;
    }
}



function formatDateToDDMMYYYY(timestamp) {
    const fecha = new Date(timestamp);
    const dia = String(fecha.getDate()).padStart(2, '0'); // Obtiene el día y lo formatea con dos dígitos
    const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Obtiene el mes (se suma 1 porque los meses empiezan en 0)
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