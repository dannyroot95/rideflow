// Inicializa DataTable
var dataUser = localStorage.getItem("userData");
var user = dataUser ? JSON.parse(dataUser) : null;
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

    let button = `<button data-bs-toggle="modal" style="margin-left:20px;" data-bs-target="#userModal" class="btn btn-success">
    <b>+</b>&nbsp;Agregar usuario
    </button>
    &nbsp;
    <button style="height:40px;" class="btn btn-primary" onclick="exportToExcel()"><i class="bi bi-printer-fill"></i></button>
    `;
    $(button).appendTo('.dt-length');
}

createDatatable();

const dataTable = $('#tb-data').DataTable();
const usersCollection = db.collection('users');

usersCollection.where("typeUser", "not-in", ["association", "superAdmin"]).onSnapshot((snapshot) => {
    // Limpia el DataTable antes de añadir nuevos datos
    dataTable.clear();
    dataExcel = []
    
    snapshot.forEach((doc, index) => {
        const userData = doc.data();

        let details = `<center><button class="btn btn-light" style="background-color:#000;color:white;" data-user='${JSON.stringify(userData)}' onclick="showDetails(this)"><i class="bi bi-eye-fill"></i></button></center>`;

        if (user.typeUser === "superAdmin") {
            details = `<center>
            <button class="btn btn-light" style="background-color:#000;color:white;" data-user='${JSON.stringify(userData)}' onclick="showDetails(this)">
            <i class="bi bi-eye-fill"></i>
            </button>
            &nbsp;&nbsp;
            <button class="btn btn-danger" onclick="deleteUser('${userData.id}','${userData.name}','${userData.lastName}')">
            <i class="bi bi-trash3-fill"></i>
            </button>
            </center>`;
        }

        // Asignación de typeUserText usando switch
        let typeUserText;
        switch (userData.typeUser) {
            case "admin":
                typeUserText = "Administrador";
                break;
            case "window":
                typeUserText = "Ventanilla";
                break;
            case "operator":
                typeUserText = "Operador";
                break;
            case "inspector":
                typeUserText = "Inspector";
                break;
            default:
                typeUserText = "Ciudadano";
        }

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
            userData.name,
            userData.lastName,
            userData.email,
            userData.dni,
            userData.phone,
            statusText,
            typeUserText
        ]);


        dataExcel.push({
            "Nombres": userData.name,
            "Apellidos": userData.lastName,
            "Correo": userData.email,
            "DNI": userData.dni,
            "DNI": userData.dni,
            "Estado": statusText,
            "Tipo de usuario": typeUserText,
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
    const lastName = document.getElementById("lastName").value;
    const dni = document.getElementById("dni").value;
    const phone = document.getElementById("phone").value;
    const status = document.getElementById("status").checked ? "on" : "off";
    const typeUser = document.getElementById("typeUser").value;
    const auth = firebase.auth();

    disable(); // Deshabilitar botones o interacciones mientras se procesa

    try {
        // Crear al usuario en Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, "TemporaryPassword123!");
        const userId = userCredential.user.uid;

        // Guardar los datos adicionales del usuario en Firestore
        await db.collection("users").doc(userId).set({
            id: userId,
            name: name,
            lastName: lastName,
            dni: dni,
            email: email,
            phone: phone,
            status: "on",
            typeUser: typeUser
        });

        // Enviar enlace para que el usuario establezca su contraseña
        const actionCodeSettings = {
            url: 'https://rideflow.online', // Cambia a tu URL
            handleCodeInApp: true
        };
        await auth.sendPasswordResetEmail(email, actionCodeSettings);

        // Registrar la acción en los logs
        await firebase.firestore().collection("logs").add({
            idUser: userId,
            nameUser: `${name} ${lastName}`,
            type: "create",
            content: `El usuario ha solicitado crear un usuario: ${typeUser}`,
            timestamp: Date.now()
        });

        Swal.fire({
            title: "Muy bien",
            text: "¡El usuario ha sido creado y el enlace para establecer contraseña se ha enviado al correo!",
            icon: "success"
        });

        $('#userModal').modal('hide');
        enable();

    } catch (error) {
        enable();
        console.error("Error al crear el usuario:", error);
        Swal.fire({
            title: "Oops",
            text: "Error al procesar la solicitud -> " + error.message,
            icon: "error"
        });
    }
});


function deleteUser(uid,name,lastName){

    Swal.fire({
        title: "Esta seguro de eliminar a este usuario?",
        showDenyButton: true,
        confirmButtonText: "Si",
        denyButtonText: `No`
      }).then((result) => {
        if (result.isConfirmed) {
            const url = "https://secure-escarpment-09449-7f155548382f.herokuapp.com/api/deleteUser";

            const data = {
            uid: uid
            };

            $('#modalDelete').modal('show');

            fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                db.collection("users").doc(uid).delete().then(result => { 
                    $('#modalDelete').modal('hide');

                    firebase.firestore().collection("logs").add({
                        idUser: user.id,
                        nameUser:user.name,
                        type : "delete",
                        content : `El Super Administrador ha eliminado un usuario : ${name} ${lastName}`,
                        timestamp : Date.now()
                    });

                }).catch(error => {
                    $('#modalDelete').modal('hide');
                    Swal.fire({
                        title: "Oops",
                        text: "Error al eliminar el usuario!",
                        icon: "error"
                    });
                    console.error("Error al eliminar el usuario:", error);
                });
                
            })
            .catch(error => {
                $('#modalDelete').modal('hide');
                Swal.fire({
                    title: "Oops",
                    text: "Error al eliminar el usuario!",
                    icon: "error"
                });
                console.error("Error al eliminar el usuario:", error);
            });
        } 
      });


}

// Función para activar/desactivar usuarios
function toggleUserStatus(idUser, newStatus, idLabel) {
    const labelElement = document.getElementById(idLabel);
    labelElement.innerHTML = newStatus === 'on' ? 'Activo' : 'Inactivo';
    labelElement.style.color = newStatus === 'on' ? '#136800' : '#fc0000';
    usersCollection.doc(idUser).update({ status: newStatus })

    firebase.firestore().collection("logs").add({
        idUser: user.id,
        nameUser:user.name+' '+user.lastName,
        type : "update",
        content : `El usuario ha modificado un estado de usuario (${idUser}) : ${newStatus}`,
        timestamp : Date.now()
    });

}

function showDetails(button) {
    // Recupera el objeto user desde el atributo data-user del botón
    const userData = JSON.parse(button.getAttribute('data-user'));
    // Aquí puedes manejar la visualización de los detalles del usuario
    console.log(userData);
    alert(`Nombre: ${userData.name}\nApellido: ${userData.lastName}\nEmail: ${userData.email}\nEstado: ${userData.status}`);
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
  

    let xls = new XlsExport(dataExcel, 'usuarios');
    xls.exportToXLS('usuarios.xls')
  }
