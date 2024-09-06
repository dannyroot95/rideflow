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

    let button = `<button data-bs-toggle="modal" data-bs-target="#userModal" class="btn btn-success" style="margin-left:10px;">Agregar usuario</button>`;
    $(button).appendTo('.dt-length');
}

createDatatable();

const dataTable = $('#tb-data').DataTable();
const usersCollection = db.collection('users');

usersCollection.onSnapshot((snapshot) => {
    // Limpia el DataTable antes de añadir nuevos datos
    dataTable.clear();
    
    snapshot.forEach((doc, index) => {
        const userData = doc.data();

        const details = `<center><button class="btn btn-light" style="background-color:#000;color:white;" data-user='${JSON.stringify(userData)}' onclick="showDetails(this)">Ver</button></center>`;

        // Asignación de typeUserText usando switch
        let typeUserText;
        switch (userData.typeUser) {
            case "superAdmin":
                typeUserText = "Super Administrador";
                break;
            case "admin":
                typeUserText = "Administrador";
                break;
            case "window":
                typeUserText = "Ventanilla";
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

    disable()

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const name = document.getElementById("name").value;
    const lastName = document.getElementById("lastName").value;
    const dni = document.getElementById("dni").value;
    const phone = document.getElementById("phone").value;
    const status = document.getElementById("status").checked ? "on" : "off";
    const typeUser = document.getElementById("typeUser").value;
    const auth = firebase.auth();

    try {
        // Crear el usuario en Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const userId = userCredential.user.uid;

        // Guardar los datos del usuario en Firestore
        await db.collection("users").doc(userId).set({
            id: userId,
            name: name,
            lastName: lastName,
            dni: dni,
            email: email,
            phone: phone,
            status: status,
            typeUser: typeUser
        });

        $('#userModal').modal('hide');
        enable()

    } catch (error) {
        enable()
        console.error("Error al crear el usuario:", error);
        alert("Error: " + error.message);
    }
});

// Función para activar/desactivar usuarios
function toggleUserStatus(idUser, newStatus, idLabel) {
    const labelElement = document.getElementById(idLabel);
    labelElement.innerHTML = newStatus === 'on' ? 'Activo' : 'Inactivo';
    labelElement.style.color = newStatus === 'on' ? '#136800' : '#fc0000';
    usersCollection.doc(idUser).update({ status: newStatus })

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