// Inicializa DataTable
let dataUser = localStorage.getItem("userData");
let user = dataUser ? JSON.parse(dataUser) : null;
var dataExcel = []
var allOperators = []

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

    document.getElementById("tbody").innerHTML = ""
    document.getElementById("loaderFolders").style = "display:flex;"
    const data = JSON.parse(button.getAttribute('data-user'));
    $('#detailAsociation').modal('show'); 
    document.getElementById("nameAsociation").value = data.association
    document.getElementById("boss").value = data.name
    document.getElementById("rucDetail").value = data.ruc
    document.getElementById("phoneDetail").value = data.phone
  
    setTimeout(() => {
        // Selecciona todos los elementos con la clase "dt-column-order"
        const elements = document.querySelectorAll('.dt-column-order');
        // Itera sobre los elementos y dispara un evento de clic en cada uno
        elements.forEach(element => {
            element.click(); // Simula un clic en el elemento
        });
    }, 500);

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



function setDataFolders(ruc) {
    try {
        const dataTable = $('#tb-data2').DataTable();
        var idUserAssociation = ""
        var codeFolder = ""

        // Limpia el DataTable antes de añadir nuevos datos
        dataTable.clear();

        // Escucha los cambios en la colección 'folders' en tiempo real
        db.collection('folders')
            .where("association", "==", ruc)
            .onSnapshot(async (snapshot) => {
                // Limpia el DataTable cada vez que los datos cambien
                dataTable.clear();

                for (const doc of snapshot.docs) {
                    const folderData = doc.data();

                    // Inicializa la tabla de contenido
                    let tableContent = `
                        <table class="table">
                            <thead>
                                <tr>
                                    <th style="color:white;background-color: grey;">Nombres</th>
                                    <th style="color:white;background-color: grey;">DNI</th>
                                    <th style="color:white;background-color: grey;">Teléfono</th>
                                    <th style="color:white;background-color: grey; border-top-right-radius: 8px;">Estado</th>
                                </tr>
                            </thead>
                            <tbody>`;

                    try {
                        // Escucha los cambios en los documentos relacionados en tiempo real
                        const filesSnapshot = await db.collection('files')
                            .where("folder", "==", folderData.codeFolder)
                            .get(); // Usar onSnapshot aquí también es posible si se necesitan actualizaciones en tiempo real.

                        filesSnapshot.forEach(fileDoc => {
                            const fileData = fileDoc.data();

                            if(idUserAssociation == ""){
                                idUserAssociation = fileData.idUserAssociation
                                codeFolder = fileData.folder
                            }

                            // Añade filas a la tabla basado en los datos del archivo
                            tableContent += `
                                <tr>
                                    <td>${fileData.name}</td>
                                    <td>${fileData.dni}</td>
                                    <td>${fileData.phone}</td>
                                    <td>${getStatus(fileData.status)}</td>
                                </tr>`;
                        });

                        tableContent += '</tbody></table>';
                    } catch (fileError) {
                        console.error(`Error al obtener archivos para carpeta ${folderData.codeFolder}: `, fileError);
                    }

                    // Genera el contenido dinámico para la fila
                    const inCharge = folderData.nameInCharge || "Ninguno";
                    const content = `
                        <div class="accordion accordion-flush">  
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="heading${doc.id}">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                                        data-bs-target="#collapse${doc.id}" aria-expanded="false" aria-controls="collapse${doc.id}">  
                                        Código de carpeta: ${folderData.codeFolder} &nbsp;&nbsp; | 
                                        &nbsp;&nbsp; Cantidad de expedientes: ${folderData.quantityFiles} &nbsp;&nbsp; | 
                                        &nbsp;&nbsp; A cargo de: ${inCharge} &nbsp;&nbsp; | 
                                        &nbsp;&nbsp; Fecha de operación: ${formatoFechaDesdeTimestamp(folderData.dateRegister)} 
                                        ${obtenerHoraMinutoDesdeTimestamp(folderData.dateRegister)}
                                    </button>
                                </h2>
                                <div id="collapse${doc.id}" class="accordion-collapse collapse" 
                                    aria-labelledby="heading${doc.id}" data-bs-parent="#accordionFlushExample">
                                    <div class="accordion-body">${tableContent}</div>
                                </div>
                            </div>
                        </div>`;

                    const button = `
                        <center>
                            <button onclick="showMigrate('${folderData.id}','${inCharge}','${idUserAssociation}','${codeFolder}','${folderData.idInCharge}')" class="btn btn-danger">
                                Migrar
                            </button>
                        </center>`;

                    // Añade la fila al DataTable
                    dataTable.row.add([button, content]);
                }

                // Dibuja el DataTable con los nuevos datos
                dataTable.draw(false);
                dataTable.columns.adjust().draw(false);
                document.getElementById("loaderFolders").style = "display:none;";
            }, (error) => {
                console.error("Error al escuchar cambios en documentos: ", error);
                document.getElementById("loaderFolders").style = "display:none;";
            });
    } catch (error) {
        console.error("Error al inicializar la escucha de documentos: ", error);
        document.getElementById("loaderFolders").style = "display:none;";
    }
}

function showMigrate(id,actualInCharge,idUserAssociation,codeFolder,actualIdInCharge) {
    $('#updateMigrate').modal('show');

    let footer = document.getElementById("footer");
    footer.innerHTML = `
        <button id="btnMigrate" onclick="migrate('${id}','${actualInCharge}','${idUserAssociation}','${codeFolder}','${actualIdInCharge}')" class="btn btn-success">
            Iniciar migración
        </button>
        <div id="loaderMigrate" style="color:black;" class="loaderSmall"></div>`;
    footer.style.display = "flex";
}


async function migrate(id,actualInCharge,idUserAssociation,codeFolder,actualIdInCharge) {
    // Captura los valores del select al momento de iniciar la migración
    let idInCharge = document.getElementById("selectOperator");
    let optionSelect = idInCharge.options[idInCharge.selectedIndex];
    let nameInCharge = optionSelect.text;

    
    console.log(actualIdInCharge+' '+idInCharge.value)


    if (actualIdInCharge === idInCharge.value) {
        Swal.fire({
            title: "Advertencia",
            text: "El nuevo operador debe ser diferente al actual.",
            icon: "warning"
        });
        return; // Salir de la función
    }

    // Muestra el loader y oculta los botones
    document.getElementById("loaderMigrate").style.display = "flex";
    document.getElementById("btn-close-modal3").style.display = "none";
    document.getElementById("btnMigrate").style.display = "none";
    document.getElementById("selectOperator").disabled = true

    try {
        // Actualiza el atributo `idInCharge` en el documento de la colección `folders`
        await db.collection('folders').doc(id).update({
            idInCharge: idInCharge.value,
            nameInCharge: nameInCharge
        });
        console.log(`Atributo 'idInCharge' actualizado en folder ${id}.`);

        // Obtiene los documentos de la colección `files` donde `idFolder` coincide con `id`
        const filesSnapshot = await db.collection('files').where('idFolder', '==', id).get();

        if (!filesSnapshot.empty) {
            const batch = db.batch(); // Usa un batch para realizar actualizaciones múltiples

            filesSnapshot.forEach(fileDoc => {
                const fileRef = db.collection('files').doc(fileDoc.id);

                // Actualiza cada documento en la colección `files`
                batch.update(fileRef, {
                    idInCharge: idInCharge.value,
                    inCharge: nameInCharge
                });
            });

            // Ejecuta el batch
            await batch.commit();

            await db.collection("logs").add({
                idUser: user.id,
                nameUser:user.name +' '+user.lastName,
                type : "update",
                content : `El usuario ha realizado una migracion de operador a operador
                ${actualInCharge} -> ${nameInCharge}
                `,
                timestamp : Date.now()
            });

            await firebase.firestore().collection("notifications").add({
                idFolder: id,
                name: user.name +' '+user.lastName,
                idUser: idUserAssociation,
                title: "¡Se ha realizado una migración!",
                type: "migration",
                content: `La carpeta ${codeFolder} a cargo de ${actualInCharge} ahora será responsable ${nameInCharge}`,
                isOpen: false,
                timestamp: Date.now()
            });

            Swal.fire({
                title: "Muy bien",
                text: "Migración completada!",
                icon: "success"
            });

            // Oculta el loader y muestra los botones
            document.getElementById("loaderMigrate").style.display = "none";
            document.getElementById("btn-close-modal3").style.display = "flex";
            document.getElementById("btnMigrate").style.display = "flex";
            document.getElementById("selectOperator").disabled = false
            $('#updateMigrate').modal('hide');
        } else {
            Swal.fire({
                title: "Oops",
                text: "No se encontraron documentos para migrar.",
                icon: "warning"
            });

            // Oculta el loader y muestra los botones
            document.getElementById("loaderMigrate").style.display = "none";
            document.getElementById("btn-close-modal3").style.display = "flex";
            document.getElementById("btnMigrate").style.display = "flex";
            document.getElementById("selectOperator").disabled = false
        }
    } catch (error) {
        Swal.fire({
            title: "Oops",
            text: "Migración cancelada!",
            icon: "warning"
        });

        // Oculta el loader y muestra los botones
        document.getElementById("loaderMigrate").style.display = "none";
        document.getElementById("btn-close-modal3").style.display = "flex";
        document.getElementById("btnMigrate").style.display = "flex";
        document.getElementById("selectOperator").disabled = false
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

