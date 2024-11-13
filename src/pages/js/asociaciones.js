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
    });

    let button = `<button data-bs-toggle="modal" data-bs-target="#userModal" class="btn btn-success" style="margin-left:10px;">
    <b>+</b>&nbsp;Agregar asociacion
    </button>

    <button style="height:40px;" class="btn btn-primary" onclick="exportToExcel()" style="margin-left:10px;"><i class="bi bi-printer-fill"></i></button>
    `;
    $(button).appendTo('.dt-length');
}

createDatatable();

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
    const password = document.getElementById("password").value;
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

    if (password.length > 5 && file) {

        disable();

        try {
            // Crear usuario en Firebase Authentication
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
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


            Swal.fire({
                title: "Muy bien",
                text: "Asociación creada!",
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
    } else {
        enable();
        Swal.fire({
            title: "Oops",
            text: "La contraseña debe tener más de 5 caracteres y se debe subir un archivo PDF.",
            icon: "info"
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
    // Recupera el objeto user desde el atributo data-user del botón
    const userData = JSON.parse(button.getAttribute('data-user'));
    // Aquí puedes manejar la visualización de los detalles del usuario
    console.log(userData);
    alert(`Asociacion: ${userData.association}\nEmail: ${userData.email}\nEstado: ${userData.status}`);
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
