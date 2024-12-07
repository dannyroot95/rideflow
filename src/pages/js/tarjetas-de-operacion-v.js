var dataUser = localStorage.getItem("userData");
var user = dataUser ? JSON.parse(dataUser) : null;
var cardGenerated
var dataExcel = []

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

    let button = `<button style="height:40px;margin-left:10px;" class="btn btn-success" onclick="exportToExcel()" style="margin-left:10px;"><i class="bi bi-printer-fill"></i></button>`;
    $(button).appendTo('.dt-length');

}

createDatatable();

const dataTable = $('#tb-data').DataTable();
const usersCollection = db.collection('cards');

usersCollection.onSnapshot((snapshot) => {
    // Limpia el DataTable antes de añadir nuevos datos
    dataTable.clear();
    dataExcel = []

    snapshot.forEach((doc) => {
        const fileData = doc.data();
        let revok = fileData.status
        let details = ``
        
        if(revok == "ok" || revok == "request"){
            revok = `<label style="color:green;font-weight:bold;">No</label>`
            details = `
            <center>
                <button class="btn btn-light" style="background-color:#C70039;color:white;height:40px;" 
                    data-user='${JSON.stringify(fileData)}' onclick="showDetails(this)">
                    <i class="bi bi-eye-fill"></i>
                </button>
            </center>
        `;
        }else{
            revok = `<label style="color:red;font-weight:bold;">Si</label>`
        }
        
        // Añadir los datos a DataTable
        dataTable.row.add([
            details,
            fileData.name,
            fileData.dni,
            fileData.numCardOperation,
            getStatus(fileData.dateGenerated,fileData.expiryDate),
            fileData.dateGenerated,
            fileData.expiryDate,
            revok
        ]);

        
        dataExcel.push({
            'Nombres':fileData.name,
            'DNI':fileData.dni,
            '# de tarjeta':fileData.numCardOperation,
            'Estado':getStatus(fileData.dateGenerated,fileData.expiryDate),
            'Fecha de emisión':fileData.dateGenerated,
            'Fecha de vencimiento':fileData.expiryDate,
        })

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
    document.getElementById("btnWhatsApp").innerHTML = ""
    const fileData = JSON.parse(button.getAttribute('data-user'));
    document.getElementById('pdfFrame').src = ""
    $('#details').modal('show');
    updateDetailsModal(fileData);
}

// Actualiza los campos del modal con los datos del archivo
function updateDetailsModal(fileData) {
    document.getElementById("loader2").style = "display:flex;margin-top:200px;margin-bottom:-200px"
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
        var signature = new Image();
        signature.setAttribute('crossOrigin', 'anonymous');
        signature.src = fileData.signatureUrl; // Asegúrate de que la ruta es accesible
        signature.onload = function() {

            var canvas = document.createElement('canvas');
            QRCode.toCanvas(canvas, fileData.id, function (error) {
                if (error) console.error('Error al crear QR: ', error);
                document.getElementById("loader2").style.display = "none"
                var imgData = canvas.toDataURL('image/png');
                // Añadir la imagen de fondo
                const imgWidth = 90; // El ancho de la imagen debe cubrir el ancho del PDF
                const imgHeight = 132; // Altura de la imagen ajustada para cubrir la mitad superior
                const x = 0;
                const y = 0;

                // Añadir la imagen de fondo cuando esté completamente cargada
                doc.addImage(image, 'PNG', x, y, imgWidth, imgHeight);

                // Texto en el PDF
                doc.setFontSize(7);
                doc.setTextColor("#FC0000");
                doc.text('N° ' + fileData.numCardOperation, 35.5, 25);
                doc.setFontSize(6);
                doc.setTextColor("#535353");

                doc.text(fileData.nameAssociation, 4, 33);
                doc.text((fileData.plate).toUpperCase(), 4, 41.3);
                doc.text(fileData.yearBuild, 4, 48.6);
                doc.text((fileData.numSerieVehicle).toUpperCase(), 4, 56.5);
                doc.text((fileData.numEngine).toUpperCase(), 4, 64);

                doc.text((fileData.numResolution).toUpperCase(), 52.5, 35);
                doc.text((fileData.brand + ' - ' + fileData.model).toUpperCase(), 52.5, 42.5);
                doc.text((fileData.color).toUpperCase(), 52.5, 48.5);
                doc.text((fileData.category).toUpperCase(), 52.5, 55);
                doc.text(fileData.dateGenerated, 52, 61);
                doc.text(fileData.expiryDate, 71.5, 61);

                doc.text((fileData.codeVest).toUpperCase(), 29, 88.5);
                doc.addImage(imgData, 'PNG', 52.5, 82, 12, 12); // Ajusta las coordenadas y tamaño según necesites

                doc.setFontSize(5);
                doc.text(fileData.yearBuild + fileData.dni, 66, 88.5);
                doc.text(formatDateToDDMMYYYY(Date.now()) + ' ' + obtenerHoraMinutoDesdeTimestamp(Date.now()), 66, 94.5);

                // Añadir la imagen de la firma cuando esté completamente cargada
                doc.addImage(signature, 'PNG', 35, 109, 25, 10); // Ajusta las coordenadas y tamaño según necesites
                doc.setTextColor("#000");
                doc.text(fileData.nameInCharge,30, 123);
                // Exportar el PDF a un blob
                const pdfBlob = doc.output('blob');
                // Crear un URL para el blob
                const url = URL.createObjectURL(pdfBlob);

                cardGenerated = pdfBlob
                // Mostrar el PDF en el iframe del modal
                document.getElementById('pdfFrame').src = url;

                document.getElementById("btnWhatsApp").innerHTML = `<button onclick="sendWhatsApp('${fileData.phone}')" id="btnSend" class="btn btn-success">
                
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 48 48">
                <linearGradient id="k87TA_gnBJ8uBlK4qfs8ia_AltfLkFSP7XN_gr1" x1="6.718" x2="35.097" y1="12.801" y2="41.18" 
                gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#dfe9f2"></stop><stop offset=".391" stop-color="#d6e0e9">
                </stop><stop offset="1" stop-color="#bfc8d1"></stop></linearGradient>
                <path fill="url(#k87TA_gnBJ8uBlK4qfs8ia_AltfLkFSP7XN_gr1)" d="M37.848,9.86C34.073,6.083,29.052,4.002,23.709,4C12.693,4,3.727,12.962,3.722,23.979	
                c-0.001,3.367,0.849,6.685,2.461,9.622L3.598,43.04c-0.094,0.345,0.002,0.713,0.254,0.967c0.19,0.192,0.447,0.297,0.711,0.297	
                c0.085,0,0.17-0.011,0.254-0.033l9.687-2.54c2.828,1.468,5.998,2.243,9.197,2.244c11.024,0,19.99-8.963,19.995-19.98	
                C43.698,18.656,41.621,13.636,37.848,9.86z"></path><linearGradient id="k87TA_gnBJ8uBlK4qfs8ib_AltfLkFSP7XN_gr2" 
                x1="15.389" x2="28.863" y1="10.726" y2="39.265" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2ecc75">
                </stop><stop offset="1" stop-color="#0b964a"></stop></linearGradient>
                <path fill="url(#k87TA_gnBJ8uBlK4qfs8ib_AltfLkFSP7XN_gr2)" d="M34.871,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774	
                c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006	
                c8.698,0,15.777-7.077,15.78-15.776C39.49,19.778,37.851,15.814,34.871,12.832z">
                </path><path d="M28.893,33.879c-0.995,0-2.354-0.254-5.087-1.331c-3.06-1.208-6.066-3.83-8.464-7.384l-0.077-0.113	
                c-0.642-0.857-2.132-3.107-2.132-5.5c0-2.58,1.288-3.953,1.838-4.54l0.085-0.091C15.815,14.089,16.709,14,17.058,14	
                c0.369,0.004,0.682,0,0.953,0.012c0.654,0.026,1.399,0.215,1.936,1.409l0,0c0.25,0.558,0.676,1.605,1.009,2.426	
                c0.213,0.527,0.386,0.955,0.439,1.069c0.294,0.586,0.308,1.167,0.036,1.714l-0.065,0.133c-0.128,0.262-0.261,0.533-0.544,0.863	
                l-0.235,0.282c-0.162,0.197-0.325,0.393-0.47,0.545c0.389,0.641,1.206,1.856,2.331,2.86c1.394,1.241,2.588,1.76,3.229,2.039	
                c0.127,0.055,0.233,0.102,0.317,0.142c0.405-0.47,1.072-1.271,1.302-1.614c0.77-1.156,1.877-0.755,2.24-0.622	
                c0.569,0.206,3.323,1.576,3.35,1.589l0.255,0.125c0.419,0.203,0.813,0.394,1.062,0.808c0.395,0.661,0.176,2.073-0.193,3.105	
                c-0.534,1.503-2.828,2.805-4.054,2.915l-0.226,0.024C29.465,33.855,29.196,33.879,28.893,33.879z M17.216,16	
                c-0.14,0-0.385-0.058-0.686,0.27l-0.101,0.109c-0.453,0.483-1.297,1.383-1.297,3.172c0,1.843,1.326,3.757,1.732,4.3	
                c0.027,0.036,0.071,0.101,0.135,0.194c2.175,3.223,4.853,5.582,7.541,6.642c3.384,1.335,4.253,1.234,4.956,1.151l0.278-0.03	c0.609-0.055,2.122-0.951,2.351-1.594c0.209-0.585,0.276-1.087,0.287-1.374c-0.044-0.021-0.092-0.043-0.143-0.067l-0.283-0.139	
                c-0.637-0.32-2.779-1.366-3.131-1.495c-0.442,0.608-1.262,1.565-1.479,1.814c-0.407,0.467-1.127,0.909-2.229,0.354	
                c-0.066-0.033-0.156-0.071-0.268-0.12c-0.691-0.301-2.13-0.926-3.763-2.38c-1.469-1.311-2.474-2.904-2.838-3.529	
                c-0.445-0.761-0.322-1.495,0.366-2.18c0.12-0.12,0.257-0.291,0.397-0.46l0.262-0.314c0.118-0.137,0.161-0.226,0.267-0.441	
                l0.035-0.071c-0.092-0.204-0.278-0.659-0.502-1.213c-0.323-0.797-0.736-1.815-0.979-2.357v0c-0.065-0.144-0.114-0.215-0.138-0.245	
                c0.005,0.015-0.029,0.016-0.058,0.014C17.706,16,17.463,16,17.216,16z M32.407,28.615L32.407,28.615L32.407,28.615z M19.642,19.736	
                L19.642,19.736L19.642,19.736z" opacity=".05"></path><path 
                d="M28.889,33.384c-0.846,0-2.155-0.22-4.899-1.302c-2.967-1.17-5.891-3.727-8.233-7.198l-0.087-0.128	
                c-0.616-0.822-2.037-2.962-2.037-5.206c0-2.382,1.193-3.654,1.703-4.198l0.089-0.096c0.625-0.683,1.351-0.756,1.634-0.756	
                c0.377,0.003,0.667,0,0.931,0.012c0.492,0.02,1.057,0.124,1.502,1.114l0,0c0.249,0.554,0.671,1.594,1.001,2.409	
                c0.225,0.555,0.405,1.002,0.452,1.097c0.082,0.165,0.338,0.674,0.039,1.275l-0.067,0.136c-0.125,0.255-0.233,0.476-0.475,0.758	
                L20.2,21.59c-0.173,0.21-0.346,0.419-0.496,0.569c-0.216,0.215-0.216,0.215-0.13,0.362c0.328,0.563,1.232,1.998,2.541,3.165	c1.453,1.295,2.696,1.834,3.363,2.124c0.144,0.062,0.259,0.113,0.344,0.156c0.293,0.146,0.323,0.116,0.427-0.002	
                c0.288-0.328,1.168-1.364,1.463-1.807c0.554-0.83,1.269-0.57,1.654-0.431c0.506,0.184,3.039,1.437,3.296,1.566l0.262,0.128	
                c0.38,0.184,0.68,0.329,0.852,0.614c0.254,0.426,0.149,1.603-0.235,2.681c-0.488,1.371-2.646,2.497-3.628,2.585l-0.239,0.026	
                C29.441,33.354,29.196,33.384,28.889,33.384z M17.201,15.5c-0.026,0-0.052,0-0.078,0c-0.183,0-0.595,0.031-0.962,0.432l-0.097,0.104	
                c-0.465,0.496-1.432,1.528-1.432,3.514c0,1.943,1.281,3.864,1.832,4.6c0.025,0.033,0.064,0.09,0.121,0.174	
                c2.231,3.306,4.991,5.73,7.772,6.828c3.505,1.382,4.445,1.271,5.197,1.183l0.267-0.029c0.693-0.062,2.451-1.013,2.776-1.925	c0.333-0.932,0.347-1.71,0.296-1.877c0.007,0.006-0.232-0.098-0.405-0.182l-0.276-0.136c-0.623-0.313-2.806-1.381-3.188-1.52	
                c-0.36-0.13-0.361-0.133-0.48,0.046c-0.349,0.521-1.32,1.657-1.542,1.91c-0.642,0.735-1.384,0.359-1.629,0.236	
                c-0.072-0.036-0.171-0.078-0.293-0.131c-0.668-0.291-2.057-0.895-3.63-2.296c-1.416-1.262-2.387-2.803-2.739-3.407	
                c-0.476-0.814,0.059-1.347,0.287-1.574c0.13-0.13,0.28-0.313,0.431-0.497l0.255-0.306c0.159-0.186,0.226-0.322,0.336-0.547	
                l0.07-0.143c0.049-0.098,0.058-0.189-0.04-0.383c-0.052-0.104-0.245-0.578-0.483-1.167c-0.326-0.803-0.741-1.829-0.987-2.374l0,0	
                c-0.229-0.509-0.363-0.515-0.632-0.525C17.717,15.5,17.461,15.5,17.201,15.5z" opacity=".07"></path><path fill="#fff" 
                fill-rule="evenodd" d="M19.035,15.831c-0.355-0.79-0.729-0.806-1.068-0.82	
                C17.69,14.999,17.374,15,17.058,15s-0.83,0.119-1.265,0.594c-0.435,0.475-1.661,1.622-1.661,3.956s1.7,4.59,1.937,4.906	c0.237,0.316,3.282,5.259,8.104,7.161c4.007,1.58,4.823,1.266,5.693,1.187c0.87-0.079,2.807-1.147,3.202-2.255	c0.395-1.108,0.395-2.057,0.277-2.255c-0.119-0.198-0.435-0.316-0.909-0.554s-2.807-1.385-3.242-1.543	
                c-0.435-0.158-0.751-0.237-1.068,0.238c-0.316,0.474-1.225,1.543-1.502,1.859c-0.277,0.317-0.554,0.357-1.028,0.119	c-0.474-0.238-2.002-0.738-3.815-2.354c-1.41-1.257-2.362-2.81-2.639-3.285c-0.277-0.474-0.03-0.731,0.208-0.968	
                c0.213-0.213,0.474-0.554,0.712-0.831c0.237-0.277,0.316-0.475,0.474-0.791c0.158-0.317,0.079-0.594-0.04-0.831	C20.379,19.115,19.457,16.769,19.035,15.831z" clip-rule="evenodd"></path></svg>
                Enviar al WhatsApp</button>
                `

                // Mostrar el modal
            });
        };

        signature.onerror = function() {
            console.error("Error loading the signature image.");
        };
    };

    image.onerror = function() {
        console.error("Error loading the background image.");
    };
}

function sendWhatsApp(phone){
    uploadPDFToFirebase(cardGenerated,phone)
}

function uploadPDFToFirebase(pdfBlob,phone) {

    document.getElementById("loader3").style = "display: block;margin-bottom: 0px;"
    document.getElementById("btn-close-modal").style = "visibility: hidden;"
    document.getElementById("btnSend").disabled = true
   

    const storageRef = firebase.storage().ref();
    const pdfRef = storageRef.child(`pdfs/documento_${Date.now()}.pdf`); // Crea una referencia con un nombre único

    // Sube el archivo
    pdfRef.put(pdfBlob).then((snapshot) => {
        return snapshot.ref.getDownloadURL(); // Obtiene la URL de descarga
    }).then((downloadURL) => {
        // Llama a la función para enviar el enlace por WhatsApp
        sendWhatsAppMessage(downloadURL,phone);
    }).catch((error) => {
        document.getElementById("loader3").style = "display: none;"
        document.getElementById("btn-close-modal").style = "visibility: visible;"
        document.getElementById("btnSend").disabled = false
        Swal.fire({
            title: "Oops",
            text: "No se pudo enviar!.",
            icon: "error"
        });
    });
}


function sendWhatsAppMessage(link,phone){

    const url = "https://api.ultramsg.com/instance98810/messages/chat";
    const token = "q7tw6v7wvgcsi7yl";
    const phoneNumber = `+51${phone}`;
    const message = "Su tarjeta de operacion ha sido generada exitosamente , descargue aquí -> "+link+"&priority=10";
    const priority = 10;

    // Construir la URL con los parámetros
    const fullUrl = `${url}?token=${encodeURIComponent(token)}&to=${encodeURIComponent(phoneNumber)}&body=${encodeURIComponent(message)}&priority=${priority}`;

    fetch(fullUrl, {
    method: 'GET', // Cambiamos a GET ya que los datos están en la URL
    redirect: 'follow'
    })
    .then(response => {
        Swal.fire({
            title: "Muy bien",
            text: "Mensaje enviado correctamente!.",
            icon: "success"
        });
        document.getElementById("loader3").style = "display: none;"
        document.getElementById("btn-close-modal").style = "visibility: visible;"
        document.getElementById("btnSend").disabled = false
    })
    .then(result => console.log("Response Body:", result))
    .catch(error => 
        {
            document.getElementById("loader3").style = "display: none;"
            document.getElementById("btn-close-modal").style = "visibility: visible;"
            document.getElementById("btnSend").disabled = false
            Swal.fire({
                title: "Oops",
                text: "No se pudo enviar!.",
                icon: "error"
            });
        }
    );



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



function exportToExcel(){

    Swal.fire({
        title: 'En breves se descargará el archivo!',
        timer: 2000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading()
        },
      })
  

    let xls = new XlsExport(dataExcel, 'tarjetas');
    xls.exportToXLS('tarjetas-de-operación.xls')
  }
