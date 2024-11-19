var dataUser = localStorage.getItem("userData");
var user = dataUser ? JSON.parse(dataUser) : null;
var boss = ""
var signatureUrl = ""
var dataExcel = []

getSignature()

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

    let button = `
    <button style="height:40px;margin-left:5px;" class="btn btn-dark" onclick="exportToExcel()" style="margin-left:10px;"><i class="bi bi-printer-fill"></i></button>`;
    $(button).appendTo('.dt-length');

}

createDatatable();

const dataTable = $('#tb-data').DataTable();
const usersCollection = db.collection('files');

usersCollection.where("status", "==", "aproved").onSnapshot((snapshot) => {
    // Limpia el DataTable antes de añadir nuevos datos
    dataTable.clear();

    snapshot.forEach((doc) => {
        const fileData = doc.data();
        const details = `
            <center>
                <button class="btn btn-light" style="background-color:#093e00;color:white;" 
                    data-user='${JSON.stringify(fileData)}' onclick="showDetails(this)">
                    Ver
                </button>
            </center>
        `;
        
        const status = getStatus(fileData.status);
        const numCardOperation = fileData.numCardOperation || "Sin registro";
        const formattedDate = `${formatDateToDDMMYYYY(fileData.dateRegister)} ${obtenerHoraMinutoDesdeTimestamp(fileData.dateRegister)}`;

        // Añadir los datos a DataTable
        dataTable.row.add([
            details,
            fileData.code,
            fileData.name,
            fileData.dni,
            fileData.phone,
            formattedDate,
            numCardOperation,
            status
        ]);

        dataExcel.push({
            'Código': fileData.code,
            'Nombres':fileData.name,
            'DNI': fileData.dni,
            'Teléfono': fileData.phone,
            'Fecha': formattedDate,
            'Marca' : fileData.brand,
            'Modelo' : fileData.model,
            'Placa' : fileData.plate,
            'Serie de vehículo' : fileData.numSerieVehicle,
            'Serie de motor' : fileData.numEngine,
            'Tarjeta de operación' : numCardOperation,
            'Estado' : status
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
    const fileData = JSON.parse(button.getAttribute('data-user'));

    $('#details').modal('show');
    updateDetailsModal(fileData);

    if (fileData.numCardOperation == null) {
        document.getElementById("btnCorrect").innerHTML = `
            <button id="btn-add-user" data-user='${JSON.stringify(fileData)}' 
                onclick="generate(this)" class="btn btn-success">
                Generar tarjeta de operación
            </button>
        `;
    }
}

// Actualiza los campos del modal con los datos del archivo
function updateDetailsModal(fileData) {
    document.getElementById("dni").value = fileData.dni;
    document.getElementById("name").value = fileData.name;
    document.getElementById("email").value = fileData.email;
    document.getElementById("phone").value = fileData.phone;

    document.getElementById("brand").value = fileData.brand
    document.getElementById("model").value = fileData.model
    document.getElementById("plate").value = fileData.plate
    document.getElementById("yearBuild").value = fileData.yearBuild
    document.getElementById("category").value = fileData.category
    document.getElementById("numSerieVehicle").value = fileData.numSerieVehicle
    document.getElementById("numEngine").value = fileData.numEngine
    document.getElementById("color").value = fileData.color
    document.getElementById("codeVest").value = fileData.codeVest

    document.getElementById("linkDownloadDNI").href = fileData.fileUrlDNI;
    document.getElementById("linkDownloadCertificated").href = fileData.fileUrlCertificated;
    document.getElementById("linkDownloadResolution").href = fileData.fileUrlResolution;
    document.getElementById("status").innerHTML = getStatus(fileData.status);
}

// Genera la tarjeta de operación
// Genera la tarjeta de operación y guarda los datos en la colección 'cards'
async function generate(file) {
    const fileData = JSON.parse(file.getAttribute('data-user'));
    const CardsOperationCollection = db.collection('cards');

    if(boss == "" && signatureUrl == ""){
        Swal.fire({
            title: "Oops!",
            text: "No hay firma electrónica disponible.",
            icon: "warning"
        });
        return
    }

    try {
        disable()
        // Obtén el tamaño de la colección
        const snapshot = await CardsOperationCollection.get();
        const count = snapshot.size;

         // Fecha de generación actual
         const dateGenerated = new Date();
         const formattedDateGenerated = formatDateToDDMMYYYY(dateGenerated);
 
         // Calcula la fecha de vencimiento (1 año después)
         const expiryDate = new Date();
         expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Añadir 1 año a la fecha actual
         const formattedExpiryDate = formatDateToDDMMYYYY(expiryDate);

         const numCardOperation = `${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

        // Crea un nuevo documento en la colección 'cards' con los datos de fileData
        const docRef = await CardsOperationCollection.add({
            dni: fileData.dni,
            idFile: fileData.id,
            idFolder: fileData.idFolder,
            name: fileData.name,
            phone: fileData.phone,
            numCardOperation: numCardOperation,  // Genera un número de tarjeta basado en el tamaño actual
            dateGenerated: formattedDateGenerated,
            expiryDate: formattedExpiryDate,
            numResolution : (fileData.numResolution).toUpperCase(),  // Almacena la fecha/hora actual
            brand:fileData.brand,
            model:fileData.model,
            plate:fileData.plate,
            yearBuild:fileData.yearBuild,
            numSerieVehicle:fileData.numSerieVehicle,
            numEngine:fileData.numEngine,
            color:fileData.color,
            codeVest:fileData.codeVest,
            category:fileData.category,
            idGeneratedBy : user.id,
            nameGeneratedBy : user.name+' '+user.lastName,
            nameAssociation : fileData.nameAssociation,
            nameInCharge : boss,
            signatureUrl : signatureUrl,
            status : "ok",
            isObserved : ""
        });
        
        // Actualiza el documento recién creado con su propio ID
        await docRef.update({
            id: docRef.id
        });

        await firebase.firestore().collection("files").doc(fileData.id).update({
            numCardOperation: numCardOperation
        });

        await firebase.firestore().collection("notifications").add({
                idFolder: fileData.idFolder,
                name:user.name,
                idUser : fileData.idInCharge,
                title : `Se ha generado una tarjeta de operación para la asociación`,
                type : "card",
                content : `Se ha generado una tarjeta de operación al usuario con DNI : ${fileData.dni}`,
                isOpen : false,
                timestamp : Date.now()
        });

        await firebase.firestore().collection("notifications").add({
            idFolder: fileData.idFolder,
            name:user.name,
            idUser : fileData.idUserAssociation,
            title : `Se ha generado una tarjeta de operación para la asociación`,
            type : "card",
            content : `Se ha generado una tarjeta de operación al usuario con DNI : ${fileData.dni}`,
            isOpen : false,
            timestamp : Date.now()
    });

        await db.collection("logs").add({
            idUser: user.id,
            nameUser:user.name +' '+user.lastName,
            type : "create",
            content : `El usuario ha creado una tarjeta de operación`,
            timestamp : Date.now()
    });

        Swal.fire({
            title: "Muy bien!",
            text: "Tarjeta de operación generada con éxito.",
            icon: "success"
        });

        enable()
        $('#details').modal('hide');

    } catch (error) {
        console.error("Error al generar tarjeta de operación: ", error);
        
        Swal.fire({
            title: "Oops!",
            text: "Ocurrió un error.",
            icon: "error"
        });

    }
}


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

function getStatus(status){
    if(status == "registered"){
        status = `<b style="color:#048e34;">Registrado</b>`
    }else if(status == "migrated"){
        status = `<b style="color:#b49600;">Migrado</b>`
    }else if(status == "observed"){
        status = `<b style="color:#fc0000;">Observado</b>`
    }else if(status == "corrected"){
        status = `<b style="color:#009083;">Corregido</b>`
    }else if(status == "acepted"){
        status = `<b style="color:#900C3F;">Aceptado</b>`
    }else if(status == "aproved"){
        status = `<b style="color:#00356d;">Aprobado</b>`
    }
    return status
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

function getSignature(){
    db.collection("config").doc("data").get().then((snapshot)  => {
        boss = snapshot.data().fullnameIngCharge
        signatureUrl = snapshot.data().signatureUrl
})
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
  

    let xls = new XlsExport(dataExcel, 'expedientes');
    xls.exportToXLS('expedientes.xls')
  }
