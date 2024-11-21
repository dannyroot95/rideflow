var dataUser = localStorage.getItem("userData");
var user = dataUser ? JSON.parse(dataUser) : null;
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

    let button = `<button id="addFile" data-bs-toggle="modal" data-bs-target="#fileModal" class="btn btn-primary" style="margin-left:10px;"><b>+</b>&nbsp;Agregar expediente</button>&nbsp;&nbsp;<button class="btn btn-success" id="migrateExpedientes" >Migrar expedientes</button>
    &nbsp;
    <button style="height:40px;" class="btn btn-dark" onclick="exportToExcel()" style="margin-left:10px;"><i class="bi bi-printer-fill"></i></button>
    &nbsp;
    <div id="loader-small" class="loaderSmall"></div>`;
    $(button).appendTo('.dt-length');
}

createDatatable();

const dataTable = $('#tb-data').DataTable();
const usersCollection = db.collection('files');

usersCollection.where("association", "==", user.ruc).onSnapshot((snapshot) => {
    // Limpia el DataTable antes de añadir nuevos datos
    dataTable.clear();
    dataExcel = []
    
    snapshot.forEach((doc) => {
        const fileData = doc.data();
        let details = `<center><button class="btn btn-light" 
        style="background-color:#093e00;color:white;" data-user='${JSON.stringify(fileData)}' 
        onclick="showDetails(this)">Ver</button></center>`;
        
        if(fileData.status == "registered" || fileData.status == "denied"){
            details = `<center><button class="btn btn-light" 
            style="background-color:#093e00;color:white;" data-user='${JSON.stringify(fileData)}' 
            onclick="showDetails(this)">Ver</button>&nbsp;&nbsp;<button onclick="deleteFile('${fileData.id}')" class="btn btn-danger">Eliminar</button></center>`;
        }
        
        let status = getStatus(fileData.status)

        

        // Añadir los datos a DataTable
        dataTable.row.add([
            details,
            fileData.code,
            fileData.name,
            fileData.dni,
            fileData.phone,
            formatoFechaDesdeTimestamp(fileData.dateRegister)+" "+obtenerHoraMinutoDesdeTimestamp(fileData.dateRegister),   
            status
        ]);

        
        dataExcel.push({
            'Código': fileData.code,
            'Nombres':fileData.name,
            'DNI': fileData.dni,
            'Teléfono': fileData.phone,
            'Fecha': formatoFechaDesdeTimestamp(fileData.dateRegister)+" "+obtenerHoraMinutoDesdeTimestamp(fileData.dateRegister),
            'Marca' : fileData.brand,
            'Modelo' : fileData.model,
            'Placa' : fileData.plate,
            'Serie de vehículo' : fileData.numSerieVehicle,
            'Serie de motor' : fileData.numEngine,
            'Estado' : status
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

document.getElementById("createFileForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // personal
    const email = document.getElementById("email").value;
    const name = document.getElementById("name").value;
    const dni = document.getElementById("dni").value;
    const phone = document.getElementById("phone").value;
    const dniFile = document.getElementById("dniFile").files[0];
    const soat = document.getElementById("soat").value
    const dateValiditySoat = document.getElementById("vig-soat").value
    const fileSOAT = document.getElementById("soatFile").files[0];
    const licence = document.getElementById("licence").value
    const dateValidityLicence = document.getElementById("vig-licence").value
    const fileLicence = document.getElementById("licenceFile").files[0];
    const photo = document.getElementById("file-input-photo").files[0];
    //vehicle
    const brand = document.getElementById("brand").value;
    const model = document.getElementById("model").value;
    const plate = document.getElementById("plate").value;
    const yearBuild = document.getElementById("yearBuild").value;
    const numSerieVehicle = document.getElementById("numSerieVehicle").value;
    const numEngine = document.getElementById("numEngine").value;
    const color = document.getElementById("color").value;
    const codeVest = document.getElementById("codeVest").value;
    const category = document.getElementById("category").value;
    const sunarpFile = document.getElementById("sunarpFile").files[0];
    const dateValidityInspection = document.getElementById("vig-inspection").value;
    const fileInspection = document.getElementById("inspectionFile").files[0];
    const fileTerms = document.getElementById("termsFile").files[0];

    try {
        disable();

        // Verificar si el DNI ya está registrado
        const dniExists = await firebase.firestore().collection("files")
            .where("dni", "==", dni)
            .get();

        if (!dniExists.empty) {
            // Si el DNI ya existe, muestra un mensaje de error y no continúes
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true,
                didOpen: (toast) => {
                  toast.onmouseenter = Swal.stopTimer;
                  toast.onmouseleave = Swal.resumeTimer;
                }
              });
              Toast.fire({
                icon: "warning",
                title: "El asociado ya tiene registrado un expediente!"
              });
            //enable();
            //return; 
        }

        
        const storageRef = firebase.storage().ref();

        // Subir el archivo DNI a Firebase Storage
        const fileRef = storageRef.child('associations/'+user.ruc+"/files/dni/"+dni+"/"+ dniFile.name);
        await fileRef.put(dniFile);
        const fileURL = await fileRef.getDownloadURL();

        // Subir el archivo SUNARP a Firebase Storage
        const fileRef2 = storageRef.child('associations/'+user.ruc+"/files/sunarp/"+dni+"/"+ sunarpFile.name);
        await fileRef2.put(sunarpFile);
        const fileURLSunarp = await fileRef2.getDownloadURL();

        const fileRef3 = storageRef.child('associations/'+user.ruc+"/files/licence/"+licence+"/"+ fileLicence.name);
        await fileRef3.put(fileLicence);
        const fileURLLicence = await fileRef3.getDownloadURL();

        const fileRef4 = storageRef.child('associations/'+user.ruc+"/files/soat/"+soat+"/"+ fileSOAT.name);
        await fileRef4.put(fileSOAT);
        const fileURLSOAT = await fileRef4.getDownloadURL();

        const fileRef5 = storageRef.child('associations/'+user.ruc+"/files/inspection/"+dni+"/"+ fileInspection.name);
        await fileRef5.put(fileInspection);
        const fileURLInspection = await fileRef5.getDownloadURL();

        const fileRef6 = storageRef.child('associations/'+user.ruc+"/files/photo/"+dni+"/"+ photo.name);
        await fileRef6.put(photo);
        const fileURLPhoto = await fileRef6.getDownloadURL();

        const fileRef7 = storageRef.child('associations/'+user.ruc+"/files/terms/"+dni+"/"+ fileTerms.name);
        await fileRef7.put(fileTerms);
        const fileURLTerms = await fileRef7.getDownloadURL();

        const randomNumber = Math.floor(Math.random() * 10000).toString() + dni;

        // Crear un nuevo documento en Firestore con un ID automático
        const docRef = await firebase.firestore().collection("files").add({
            code: randomNumber,
            association : user.ruc,
            name: name,
            dni: dni,
            email: email,
            phone: phone,
            fileUrlDNI: fileURL,
            fileURLSunarp:fileURLSunarp,
            status: "registered",
            folder: "",
            idInCharge : "",
            txtNote: "",
            inCharge : "",
            dateRegister : Date.now(),
            timesObserved : 0,
            idUserAssociation : user.id,
            idFolder : "",
            brand:brand,
            model:model,
            plate:plate,
            yearBuild:yearBuild,
            numSerieVehicle:numSerieVehicle,
            numEngine:numEngine,
            color:color,
            codeVest:codeVest,
            category:category,
            nameAssociation : user.association,
            licence:licence,
            fileURLLicence : fileURLLicence,
            dateValidityLicence : dateValidityLicence,
            soat:soat,
            dateValiditySoat : dateValiditySoat,
            fileURLSOAT : fileURLSOAT,
            dateValidityInspection:dateValidityInspection,
            fileURLInspection : fileURLInspection,
            fileURLTerms : fileURLTerms,
            photo : fileURLPhoto 


        });

        // Opcional: Actualizar el documento con el ID si es necesario
        await firebase.firestore().collection("files").doc(docRef.id).update({
            id: docRef.id
        });

        await firebase.firestore().collection("logs").add({
            idUser: user.id,
            nameUser:user.name,
            type : "create",
            content : `El usuario ha creado un expediente`,
            timestamp : Date.now()
        });

        Swal.fire({
            title: "Muy bien",
            text: "Expediente creado!",
            icon: "success"
        });

        $('#fileModal').modal('hide');
        enable();

    } catch (error) {
        enable();
        Swal.fire({
            title: "Oops",
            text: "Error al crear el expediente -> " + error.message,
            icon: "error"
        });
    }
});

document.getElementById('migrateExpedientes').addEventListener('click', async () => {

    Swal.fire({
        title: "¿Estás seguro de migrar los expedientes?",
        showDenyButton: true,
        confirmButtonText: "Sí",
        denyButtonText: `No`
    }).then(async (result) => {
        if (result.isConfirmed) {
            const userData = JSON.parse(localStorage.getItem("userData"));  // Asegúrate de tener esta info almacenada
            const dataTable = $('#tb-data').DataTable();  // Asegúrate de que esta es la instancia correcta de tu DataTable
            const filesCollection = db.collection('files');
            const foldersCollection = db.collection('folders');

            try {
                // Obtener los DNIs visibles en la tabla cuyo estado es "Registrado"
                const visibleDnis = [];
                dataTable.rows({ search: 'applied' }).data().each(function (value) {
                    if ($(value[6]).text() === "Registrado") {  // Asumiendo que el estado está en la sexta columna
                        visibleDnis.push(value[3]);  // Asumiendo que el DNI está en la cuarta columna
                    }
                });

                // Comprobar si hay DNIs con estado "Registrado"
                if (visibleDnis.length === 0) {
                    Swal.fire({
                        title: "Oops!",
                        text: "No hay expedientes para migrar.",
                        icon: "info"
                    });
                    return;  // Salir de la función si no hay registros para procesar
                }

                // Mostrar loader y deshabilitar botones
                document.getElementById("loader-small").style = "display : inline-block;";
                document.getElementById("addFile").disabled = true;
                document.getElementById("migrateExpedientes").disabled = true;

                // Contar documentos en la colección 'folders'
                const snapshot = await foldersCollection.get();
                const count = snapshot.size;
                const folderId = `Desk-${userData.ruc}-${count + 1}`;

                // Crear un batch para realizar las actualizaciones
                const batch = db.batch();

                // Agregar las actualizaciones al batch usando Promise.all
                const updatePromises = visibleDnis.map(async (dni) => {
                    const querySnapshot = await filesCollection.where('dni', '==', dni).get();
                    querySnapshot.forEach(doc => {
                        batch.update(doc.ref, {
                            status: 'migrated',
                            folder: folderId
                        });
                    });
                });

                // Esperar que todas las actualizaciones terminen
                await Promise.all(updatePromises);

                // Ejecutar el batch de actualizaciones
                await batch.commit();

                // Crear un nuevo documento en 'folders' después de migrar expedientes
                const newFolderDoc = await foldersCollection.add({
                    codeFolder: folderId,
                    association: user.ruc,
                    quantityFiles: visibleDnis.length,
                    dateRegister: Date.now(),
                    status: "migrated",
                    nameAssociation: userData.association,
                    idInCharge : "",
                    nameInCharge : ""
                });

                // Actualizar el documento recién creado con su propio ID
                await foldersCollection.doc(newFolderDoc.id).update({
                    id: newFolderDoc.id
                });

                // Crear notificación sobre la nueva carpeta
                await firebase.firestore().collection("notifications").add({
                    idFolder: newFolderDoc.id,
                    name: user.association,
                    idUser: "",
                    title: "¡Una nueva carpeta ha sido recibida!",
                    type: "folder",
                    content: `Se ha enviado ${visibleDnis.length} expedientes`,
                    isOpen: false,
                    timestamp: Date.now()
                });

                await firebase.firestore().collection("logs").add({
                    idUser: user.id,
                    nameUser:user.name,
                    type : "create",
                    content : `El usuario ha creado una carpeta`,
                    timestamp : Date.now()
                });

                // Restaurar loader y botones
                document.getElementById("loader-small").style = "display : none;";
                document.getElementById("addFile").disabled = false;
                document.getElementById("migrateExpedientes").disabled = false;

                // Notificación de éxito
                Swal.fire({
                    title: "¡Muy bien!",
                    text: "Migración completada.",
                    icon: "success"
                });

            } catch (error) {
                // Manejo de errores
                console.error('Error al migrar expedientes:', error);

                document.getElementById("loader-small").style = "display : none;";
                document.getElementById("addFile").disabled = false;
                document.getElementById("migrateExpedientes").disabled = false;

                Swal.fire({
                    title: "Oops!",
                    text: "Ocurrió un error.",
                    icon: "error"
                });
            }
        }
    });
});



document.getElementById('file-input-photo').addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const preview = document.getElementById('preview');
          preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
 });
  



function showDetails(button) {
    // Recupera el objeto user desde el atributo data-user del botón
    const fileData = JSON.parse(button.getAttribute('data-user'));
    $('#details').modal('show')
    document.getElementById("d-preview").src = fileData.photo
    document.getElementById("d-dni").value = fileData.dni
    document.getElementById("urlLinkDni").href = fileData.fileUrlDNI
    
    document.getElementById("d-name").value = fileData.name
    document.getElementById("d-email").value = fileData.email
    document.getElementById("d-phone").value = fileData.phone

    document.getElementById("d-licence").value = fileData.licence
    document.getElementById("d-vig-licence").value = fileData.dateValidityLicence
    document.getElementById("d-soat").value = fileData.soat
    document.getElementById("d-vig-soat").value = fileData.dateValiditySoat
    
    document.getElementById("d-brand").value = fileData.brand
    document.getElementById("d-model").value = fileData.model
    document.getElementById("d-plate").value = fileData.plate
    document.getElementById("d-yearBuild").value = fileData.yearBuild
    document.getElementById("d-category").value = fileData.category
    document.getElementById("d-numSerieVehicle").value = fileData.numSerieVehicle
    document.getElementById("d-numEngine").value = fileData.numEngine
    document.getElementById("d-color").value = fileData.color
    document.getElementById("d-codeVest").value = fileData.codeVest

    document.getElementById("d-vig-inspection").value = fileData.dateValidityInspection

    document.getElementById("d-sunarpObs").style.display = "none"


    document.getElementById("d-status").innerHTML = getStatusFromDetails(fileData.status)

    if(fileData.status == "registered" || fileData.status == "migrated" || fileData.status == "corrected" || fileData.status == "acepted" || fileData.status == "denied"){
        //addOn-observed btnCorect
        document.getElementById("d-dni").disabled = true
        document.getElementById("d-dni-addon-file").style.display = "none"
        document.getElementById("d-dniFile").style.display = "none"
        document.getElementById("d-dniFile").disabled = true
        document.getElementById("d-email").disabled = true
        document.getElementById("d-phone").disabled = true

        document.getElementById("d-licence").disabled = true
        document.getElementById("d-vig-licence").disabled = true
        document.getElementById("d-soat").disabled = true
        document.getElementById("d-vig-soat").disabled = true

        document.getElementById("d-brand").disabled = true
        document.getElementById("d-model").disabled = true
        document.getElementById("d-plate").disabled = true
        document.getElementById("d-yearBuild").disabled = true
        document.getElementById("d-category").disabled = true
        document.getElementById("d-numSerieVehicle").disabled = true
        document.getElementById("d-numEngine").disabled = true
        document.getElementById("d-color").disabled = true
        document.getElementById("d-codeVest").disabled = true

        document.getElementById("d-vig-inspection").disabled = true

        document.getElementById("d-addOn-observed").style = "display:none;"
        document.getElementById("d-btnCorrect").style = "display:none;"
        document.getElementById("d-btnCorrect").innerHTML = ``
        document.getElementById("d-div-content-certificated").innerHTML = ``
        document.getElementById("d-txtObserved").style = "display:none;"
        

    }else if(fileData.status == "aproved"){

        document.getElementById("d-dni").disabled = true
        document.getElementById("d-dni-addon-file").style.display = "none"
        document.getElementById("d-dniFile").style.display = "none"
        document.getElementById("d-dniFile").disabled = true
        document.getElementById("d-email").disabled = true
        document.getElementById("d-phone").disabled = true
        document.getElementById("d-brand").disabled = true
        document.getElementById("d-model").disabled = true
        document.getElementById("d-plate").disabled = true
        document.getElementById("d-yearBuild").disabled = true
        document.getElementById("d-category").disabled = true
        document.getElementById("d-numSerieVehicle").disabled = true
        document.getElementById("d-numEngine").disabled = true
        document.getElementById("d-color").disabled = true
        document.getElementById("d-codeVest").disabled = true

        document.getElementById("d-addOn-observed").style = "display:none;"
        document.getElementById("d-txtObserved").style = "display:none;"
        document.getElementById("d-btnCorrect").style = "display:none;"
        document.getElementById("d-btnCorrect").innerHTML = ``
        document.getElementById("d-div-content-certificated").innerHTML = `<span class="input-group-text">Certificado de capacitación</span>
                            <span style="background-color: #00a822;color: #ffffff;" class="input-group-text">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
                                  </svg>
                                &nbsp;  
                                <a id="linkDownloadCertificated" style="color: #ffffff;text-decoration: none;" href="${fileData.fileUrlCertificated}" target="_blank">Descargar</a></span>
                                <span class="input-group-text">Resolución de sub-gerencia</span>
                            <span style="background-color: #fc0011;color: #ffffff;" class="input-group-text">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
                                  </svg>
                                &nbsp;  
                                <a id="linkDownloadResolution" style="color: #ffffff;text-decoration: none;" href="${fileData.fileUrlResolution}" target="_blank">Descargar</a></span>
                                `
    }else if(fileData.status == "observed"){

        document.getElementById("d-dni").disabled = false
        document.getElementById("d-dni-addon-file").style = "display : flex;font-weight: 600;font-size: 12px;color: #014c69;"
        document.getElementById("d-dniFile").style.display = "flex"
        document.getElementById("d-dniFile").disabled = false
        document.getElementById("d-email").disabled = false
        document.getElementById("d-phone").disabled = false

        document.getElementById("d-licence").value = fileData.licence
        document.getElementById("d-vig-licence").value = fileData.dateValidityLicence
        document.getElementById("d-soat").value = fileData.soat
        document.getElementById("d-vig-soat").value = fileData.dateValiditySoat

        document.getElementById("d-brand").disabled = false
        document.getElementById("d-model").disabled = false
        document.getElementById("d-plate").disabled = false
        document.getElementById("d-yearBuild").disabled = false
        document.getElementById("d-category").disabled = false
        document.getElementById("d-numSerieVehicle").disabled = false
        document.getElementById("d-numEngine").disabled = false
        document.getElementById("d-color").disabled = false
        document.getElementById("d-codeVest").disabled = false

        document.getElementById("d-addOn-observed").style = "display:flex;width:100%"
        document.getElementById("d-btnCorrect").style = "display:flex;width:100%"
        document.getElementById("d-txtObserved").value = fileData.txtNote
        document.getElementById("d-txtObserved").disabled = true
        document.getElementById("d-txtObserved").style = "font-weight:bold;background-color:white;text-transform: uppercase;color:red;"

        document.getElementById("d-sunarpObs").style.display = "flex"

        document.getElementById("d-div-content-certificated").innerHTML = ``

        document.getElementById("d-btnCorrect").innerHTML = `
        <button id="d-btnSendCorrected" class="btn btn-success" onclick="sendOberved('${fileData.id}','${fileData.idFolder}','${fileData.idInCharge}','${fileData.folder}','${fileData.code}','${fileData.nameAssociation}')" >Enviar correción</button>`

    }
}

function getStatusFromDetails(status){
    if(status == "registered"){
        document.getElementById("d-status").style = "color:#fff;background-color: #048e34;"
        status = `<b>Registrado</b>`
    }else if(status == "migrated"){
        document.getElementById("d-status").style = "color:#fff;background-color: #b49600;"
        status = `<b>Migrado</b>`
    }else if(status == "observed"){
        document.getElementById("d-status").style = "color:#fff;background-color: #fc0000;"
        status = `<b>Observado</b>`
    }else if(status == "corrected"){
        document.getElementById("d-status").style = "color:#fff;background-color: #009083;"
        status = `<b>Corregido</b>`
    }else if(status == "acepted"){
        document.getElementById("d-status").style = "color:#fff;background-color: #900C3F;"
        status = `<b>Aceptado</b>`
    }else if(status == "aproved"){
        document.getElementById("d-status").style = "color:#fff;background-color: #00356d;"
        status = `<b>Aprobado</b>`
    }else if(status == "denied"){
        document.getElementById("d-status").style = "color:#fff;background-color: #fc0000;"
        status = `<b>Denegado</b>`
    }
    return status
}

function deleteFile(id){
    firebase.firestore().collection("files").doc(id).delete()
    firebase.firestore().collection("logs").add({
        idUser: user.id,
        nameUser:user.name,
        type : "delete",
        content : `El usuario ha eliminado un expediente id -> ${id}`,
        timestamp : Date.now()
    });

    Swal.fire({
        title: "Muy bien!",
        text: "Expediente eliminado!",
        icon: "success"
    });
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

var modalAddUser = document.getElementById('fileModal');
modalAddUser.addEventListener('hidden.bs.modal', function (event) {
    document.getElementById("createFileForm").reset();
    document.getElementById("preview").src = "/images/carnetDefault.JPG"
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

// Función para obtener la hora y minutos desde un timestamp
function obtenerHoraMinutoDesdeTimestamp(timestamp) {
    const fecha = new Date(timestamp);
    const horas = String(fecha.getHours()).padStart(2, '0'); // Obtiene las horas y las formatea
    const minutos = String(fecha.getMinutes()).padStart(2, '0'); // Obtiene los minutos y los formatea

    return `${horas}:${minutos}`; // Devuelve la hora en formato HH:mm
}

function sendOberved(idFile, idFolder, idInCharge, desk, code, nameAssociation) {
    // Captura los valores de los campos
    const dni = document.getElementById('d-dni').value.trim();
    const name = document.getElementById('d-name').value.trim();
    const email = document.getElementById('d-email').value.trim();
    const phone = document.getElementById('d-phone').value.trim();

    const brand = document.getElementById("d-brand").value;
    const model = document.getElementById("d-model").value;
    const plate = document.getElementById("d-plate").value;
    const yearBuild = document.getElementById("d-yearBuild").value;
    const numSerieVehicle = document.getElementById("d-numSerieVehicle").value;
    const numEngine = document.getElementById("d-numEngine").value;
    const color = document.getElementById("d-color").value;
    const codeVest = document.getElementById("d-codeVest").value;
    const category = document.getElementById("d-category").value;

    // Validación de campos vacíos
    if (!dni || !name || !email || !phone || !brand || !model || !plate || !yearBuild || !numSerieVehicle ||
        !numEngine || !color || !codeVest || !category) {
        Swal.fire({
            title: "Campos incompletos",
            text: "Por favor, completa todos los campos antes de continuar.",
            icon: "warning"
        });
        return; // Detiene la ejecución de la función si hay campos vacíos
    }

    // Muestra el loader
    document.getElementById('d-loader2').style.display = 'block';
    document.getElementById("d-btn-close-modal").style.display = "none";
    document.getElementById("d-btnSendCorrected").disabled = true;

    // Captura los archivos seleccionados
    const dniFile = document.getElementById('d-dniFile').files[0];
    const sunarpFile = document.getElementById('d-sunarpFile').files[0]; // Nuevo archivo

    // Subir ambos archivos si están presentes
    const uploadPromises = [];

    // Subir archivo DNI
    if (dniFile) {
        const dniFileRef = firebase.storage().ref().child(`associations/${user.ruc}/files/dni/${dni}/${dniFile.name}`);
        const dniUploadTask = dniFileRef.put(dniFile).then(snapshot => snapshot.ref.getDownloadURL());
        uploadPromises.push(dniUploadTask);
    } else {
        uploadPromises.push(Promise.resolve(null)); // Si no hay archivo, mantener la consistencia
    }

    // Subir archivo SUNARP
    if (sunarpFile) {
        const sunarpFileRef = firebase.storage().ref().child(`associations/${user.ruc}/files/sunarp/${dni}/${sunarpFile.name}`);
        const sunarpUploadTask = sunarpFileRef.put(sunarpFile).then(snapshot => snapshot.ref.getDownloadURL());
        uploadPromises.push(sunarpUploadTask);
    } else {
        uploadPromises.push(Promise.resolve(null)); // Si no hay archivo, mantener la consistencia
    }

    Promise.all(uploadPromises)
        .then(([dniFileURL, sunarpFileURL]) => {
            // Guarda los datos del formulario y las URLs de los archivos en Firestore
            const fileRef = firebase.firestore().collection('files').doc(idFile);

            let myUpdate = {}

            if(dniFile && sunarpFile){
                myUpdate = {
                    dni: dni,
                    name: name,
                    email: email,
                    phone: phone,
                    brand: brand,
                    model: model,
                    plate: plate,
                    yearBuild: yearBuild,
                    numSerieVehicle: numSerieVehicle,
                    numEngine: numEngine,
                    color: color,
                    codeVest: codeVest,
                    category: category,
                    status: "corrected",
                    fileUrlDNI: dniFileURL,
                    fileURLSunarp: sunarpFileURL, // URL del archivo SUNARP (si existe)
                    timestamp: Date.now()
                }
            }else if(dniFile){
                myUpdate = {
                    dni: dni,
                    name: name,
                    email: email,
                    phone: phone,
                    brand: brand,
                    model: model,
                    plate: plate,
                    yearBuild: yearBuild,
                    numSerieVehicle: numSerieVehicle,
                    numEngine: numEngine,
                    color: color,
                    codeVest: codeVest,
                    category: category,
                    status: "corrected",
                    fileUrlDNI: dniFileURL, // URL del archivo DNI (si existe)
                    timestamp: Date.now()
                }
            }else if(sunarpFile){
                myUpdate = {
                    dni: dni,
                    name: name,
                    email: email,
                    phone: phone,
                    brand: brand,
                    model: model,
                    plate: plate,
                    yearBuild: yearBuild,
                    numSerieVehicle: numSerieVehicle,
                    numEngine: numEngine,
                    color: color,
                    codeVest: codeVest,
                    category: category,
                    status: "corrected",
                    fileURLSunarp:sunarpFileURL, // URL del archivo DNI (si existe)
                    timestamp: Date.now()
                }
            }else{
                myUpdate = {
                    dni: dni,
                    name: name,
                    email: email,
                    phone: phone,
                    brand: brand,
                    model: model,
                    plate: plate,
                    yearBuild: yearBuild,
                    numSerieVehicle: numSerieVehicle,
                    numEngine: numEngine,
                    color: color,
                    codeVest: codeVest,
                    category: category,
                    status: "corrected",
                    timestamp: Date.now()
            }
        }

            return fileRef.update(myUpdate);
        })
        .then(() => {
            return firebase.firestore().collection('folders').doc(idFolder).update({ 
                status: "corrected", 
                dateRegister: Date.now() 
            });
        })
        .then(() => {
            return firebase.firestore().collection("notifications").add({
                idFolder: idFolder,
                name: user.name,
                idUser: idInCharge,
                title: `El expediente #${code} ha sido corregido`,
                type: "file",
                content: `La Asociación ${nameAssociation} con el expediente #${code} ha sido corregido en la carpeta: ${desk}`,
                isOpen: false,
                timestamp: Date.now()
            });
        })
        .then(() => {
            return firebase.firestore().collection("logs").add({
                idUser: user.id,
                nameUser: user.name,
                type: "update",
                content: `El usuario ha actualizado un estado a: corregido`,
                timestamp: Date.now()
            });
        })
        .then(() => {
            Swal.fire({
                title: "Muy bien",
                text: "Expediente corregido!",
                icon: "success"
            });
            $('#details').modal('hide');
            document.getElementById('d-loader2').style.display = 'none';
            document.getElementById("d-btn-close-modal").style.display = "block";
        })
        .catch(error => {
            Swal.fire({
                title: "Oops",
                text: "Ocurrió un error!",
                icon: "error"
            });
            document.getElementById('d-loader2').style.display = 'none';
            document.getElementById("d-btn-close-modal").style.display = "block";
            console.error('Error:', error);
        });
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
