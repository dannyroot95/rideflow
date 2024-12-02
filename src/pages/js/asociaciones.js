// Inicializa DataTable
let dataUser = localStorage.getItem("userData");
let user = dataUser ? JSON.parse(dataUser) : null;
var dataExcel = []
var allOperators = []
var idAsociation = ""

getAllOperators()

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

    let button = `<button data-bs-toggle="modal" data-bs-target="#userModal" class="btn btn-success" style="margin-left:10px;">
    <b>+</b>&nbsp;Agregar asociacion
    </button>

    <button style="height:40px;" class="btn btn-primary" onclick="exportToExcel()" style="margin-left:10px;"><i class="bi bi-printer-fill"></i></button>
    `;
    $(button).appendTo('.dt-length');
}

createDatatable();

function createDatatable2() {
    $('#tb-data1').DataTable({
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

createDatatable2();

function createDatatable3() {
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
}

createDatatable3();

const dataTable = $('#tb-data').DataTable();
const usersCollection = db.collection('users');

// Aplica un filtro para obtener solo los usuarios cuyo typeUser sea 'association'
usersCollection.where("typeUser", "==", "association").onSnapshot((snapshot) => {
    // Limpia el DataTable antes de añadir nuevos datos
    dataTable.clear();
    dataExcel = []

    snapshot.forEach((doc, index) => {
        const userData = doc.data();

        const details = `<center><button class="btn btn-light" style="background-color:#000;color:white;height:40px;" data-user='${JSON.stringify(userData)}' onclick="showDetails(this)"><i class="bi bi-eye-fill"></i></button></center>`;

        // Configuración del estado y el switch
        const statusText = (userData.status === "on") 
            ? `<center><b style="color:#136800" id="st-${index}">Activo</b><br>
                <label class="switch">
                <input type="checkbox" checked onchange="toggleUserStatus('${userData.id}', 'off', 'st-${index}')">
                <span class="slider round"></span>
                </label></center>` 
            : `<center><b style="color:#fc0000" id="st-${index}">Inactivo</b><br>
                <label class="switch">
                <input type="checkbox" onchange="toggleUserStatus('${userData.id}', 'on', 'st-${index}')">
                <span class="slider round"></span>
                </label></center>`;

        // Añadir los datos a DataTable
        dataTable.row.add([
            details,
            userData.association,
            userData.ruc,
            userData.phone,
            statusText,
            userData.email
        ]);

        dataExcel.push({
            'Asociación':userData.association,
            'RUC':userData.ruc,
            'Teléfono': userData.phone,
            'Estado': statusText,
            'Correo': userData.email,
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


document.getElementById("createUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const name = document.getElementById("name").value;
    const dni = document.getElementById("dni").value;
    const ruc = document.getElementById("ruc").value;
    const phone = document.getElementById("phone").value;
    const association = document.getElementById("association").value;
    const address = document.getElementById("address").value;
    const file = document.getElementById("file-function").files[0];  // Obtener archivo
    const status = "on"; // Siempre será activo al crear
    const typeUser = "association"; // Tipo de usuario "asociación"
    const auth = firebase.auth();

        disable();

        try {
            // Crear usuario en Firebase Authentication
            const userCredential = await auth.createUserWithEmailAndPassword(email, "TemporaryPassword123!");
            const userId = userCredential.user.uid;

            // Subir archivo PDF a Firebase Storage
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`associations/${ruc}/licence/${file.name}`);
            await fileRef.put(file);
            const fileUrl = await fileRef.getDownloadURL();  // Obtener URL del archivo

            // Guardar los datos del usuario en Firestore
            await db.collection("users").doc(userId).set({
                id: userId,
                name: name,
                dni: dni,
                ruc:ruc,
                email: email,
                phone: phone,
                address: address,
                association: association,
                fileUrl: fileUrl,  // URL del archivo subido
                status: status,
                typeUser: typeUser
            });

            await db.collection("logs").add({
                        idUser: user.id,
                        nameUser:user.name +' '+user.lastName,
                        type : "create",
                        content : `El usuario ha creado una asociación : ${association}`,
                        timestamp : Date.now()
            });

            const actionCodeSettings = {
                url: 'https://rideflow.online', // Cambia a tu URL
                handleCodeInApp: true
            };
            await auth.sendPasswordResetEmail(email, actionCodeSettings);

            Swal.fire({
                title: "Muy bien",
                text: "Asociación creada!, se envio al correo la restauración de contraseña.",
                icon: "success"
            });

            $('#userModal').modal('hide'); // Cerrar modal
            enable(); // Habilitar botones

        } catch (error) {
            enable();
            Swal.fire({
                title: "Error",
                text: `Error al crear la asociación: ${error.message}`,
                icon: "error"
            });
        }
    
});

// Función para activar/desactivar usuarios
function toggleUserStatus(idUser, newStatus, idLabel) {
    const labelElement = document.getElementById(idLabel);
    labelElement.innerHTML = newStatus === 'on' ? 'Activo' : 'Inactivo';
    labelElement.style.color = newStatus === 'on' ? '#136800' : '#fc0000';
    usersCollection.doc(idUser).update({ status: newStatus })

    db.collection("logs").add({
        idUser: user.id,
        nameUser:user.name +' '+user.lastName,
        type : "update",
        content : `El usuario ha actualizado el estado (${newStatus}) de una asociación : ${idUser}`,
        timestamp : Date.now()
});


}

function showDetails(button) {

    const data = JSON.parse(button.getAttribute('data-user'));
    $('#detailAsociation').modal('show'); 
    document.getElementById("nameAsociation").value = data.association
    document.getElementById("boss").value = data.name
    document.getElementById("rucDetail").value = data.ruc
    document.getElementById("phoneDetail").value = data.phone
    idAsociation = data.id

    setTimeout(() => {
        // Selecciona todos los elementos con la clase "dt-column-order"
        const elements = document.querySelectorAll('.dt-column-order');
        // Itera sobre los elementos y dispara un evento de clic en cada uno
        elements.forEach(element => {
            element.click(); // Simula un clic en el elemento
        });
    }, 500);

    setDataExpedients(idAsociation)
    setDataFolders(data.ruc)

}

async function getAllOperators() {
    try {
        // Obtiene los documentos de Firestore
        const snapshot = await db.collection('users').where("typeUser", "==", "operator").get();
        
        // Procesa los documentos
        const allOperators = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            const option = `<option value="${data.id}">${data.name} ${data.lastName}</option>`
            $(option).appendTo('#selectOperator');
        });

        // Muestra el resultado en la consola
        console.log(allOperators);
    } catch (error) {
        console.error("Error al obtener documentos: ", error);
    }
}


async function setDataExpedients(id) {
    try {
        const dataTable = $('#tb-data1').DataTable();
        
        const snapshot = await db.collection('files').where("idUserAssociation", "==", id).get();
        
        // Limpia el DataTable antes de añadir nuevos datos
        dataTable.clear();
        
        snapshot.forEach((doc) => {
            const fileData = doc.data();
            let details = `<center><button class="btn btn-danger" data-user='${JSON.stringify(fileData)}' 
                onclick="showMigrate('file','${fileData.id}')">Migrar</button></center>`;
            
            let status = getStatus(fileData.status);

            // Añadir los datos a DataTable
            dataTable.row.add([
                details,
                fileData.code,
                fileData.name,
                fileData.dni,
                fileData.phone,
                formatoFechaDesdeTimestamp(fileData.dateRegister) + " " + obtenerHoraMinutoDesdeTimestamp(fileData.dateRegister),
                status
            ]);
        });
        
        // Dibuja el DataTable con los nuevos datos
        dataTable.draw(false);
        dataTable.columns.adjust().draw(false);
    } catch (error) {
        console.error("Error al obtener documentos: ", error);
    }
}


async function setDataFolders(ruc) {
    try {
        const dataTable = $('#tb-data2').DataTable();
        
        // Obtiene los documentos de Firestore
        const snapshot = await db.collection('folders').where("association", "==", ruc).get();
        
        // Limpia el DataTable antes de añadir nuevos datos
        dataTable.clear();
        
        // Procesa cada documento
        snapshot.docs.forEach((doc) => {
            const folderData = doc.data();
            let inCharge = folderData.nameInCharge || "Ninguno";

            // Genera el contenido dinámico para la fila
            let content = `
                <div class="accordion accordion-flush">  
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="heading${doc.id}">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${doc.id}" aria-expanded="false" aria-controls="collapse${doc.id}">  
                                Código de carpeta: ${folderData.codeFolder} &nbsp;&nbsp; | 
                                &nbsp;&nbsp; Cantidad de expedientes : ${folderData.quantityFiles} &nbsp;&nbsp; | 
                                &nbsp;&nbsp; A cargo de : ${inCharge} &nbsp;&nbsp; |
                                &nbsp;&nbsp; Fecha de operación : ${formatoFechaDesdeTimestamp(folderData.dateRegister)} ${obtenerHoraMinutoDesdeTimestamp(folderData.dateRegister)}
                            </button>
                        </h2>
                    </div>
                </div>`;

            let button = `<center><button onclick="showMigrate('folder','${folderData.id}')" class="btn btn-danger">Migrar</button></center>`    
            
            // Añade la fila al DataTable
            dataTable.row.add([button,content]);
        });
        
        // Dibuja el DataTable con los nuevos datos
        dataTable.draw(false);
        dataTable.columns.adjust().draw(false);
    } catch (error) {
        console.error("Error al obtener documentos: ", error);
    }
}

function showMigrate(type,id){
    $('#updateMigrate').modal('show'); 
    if(type == "folder"){
        alert("folder -> "+id)
    }else{
        alert("file -> "+id)
    }
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
    }else if(status == "denied"){
        status = `<b style="color:#fc0000;">Denegado</b>`
    }
    return status
}

function formatoFechaDesdeTimestamp(timestamp) {
    const fecha = new Date(timestamp);
    const dia = String(fecha.getDate()).padStart(2, '0'); // Obtiene el día y lo formatea
    const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Obtiene el mes y lo formatea
    const anio = fecha.getFullYear(); // Obtiene el año

    return `${dia}/${mes}/${anio}`; // Devuelve la fecha en formato dd/mm/yyyy
}

function obtenerHoraMinutoDesdeTimestamp(timestamp) {
    const fecha = new Date(timestamp);
    const horas = String(fecha.getHours()).padStart(2, '0'); // Obtiene las horas y las formatea
    const minutos = String(fecha.getMinutes()).padStart(2, '0'); // Obtiene los minutos y los formatea

    return `${horas}:${minutos}`; // Devuelve la hora en formato HH:mm
}

function enable(){
    document.getElementById("btn-close-modal").style.display = "block"
    document.getElementById("btn-add-user").style.display = "block"
    document.getElementById("loader2").style.display = "none"
}

function disable(){
    document.getElementById("btn-close-modal").style.display = "none"
    document.getElementById("btn-add-user").style.display = "none"
    document.getElementById("loader2").style.display = "block"
}

var modalAddUser = document.getElementById('userModal');
modalAddUser.addEventListener('hidden.bs.modal', function (event) {
    document.getElementById("createUserForm").reset();
});

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


function exportToExcel(){

    Swal.fire({
        title: 'En breves se descargará el archivo!',
        timer: 2000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading()
        },
      })
  

    let xls = new XlsExport(dataExcel, 'asociaciones');
    xls.exportToXLS('asociaciones.xls')
  }
