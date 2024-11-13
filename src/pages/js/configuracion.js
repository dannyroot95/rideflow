var canvas = document.getElementById('signature-pad');
var signaturePad = new SignaturePad(canvas);
var storage = firebase.storage();

document.getElementById('clear').addEventListener('click', function() {
    signaturePad.clear();
});

document.getElementById("loader2").style.display = "block"
document.getElementById("clear").disabled = true
document.getElementById("save").disabled = true

db.collection("config").doc("data").get().then((snap)  => {
    
    document.getElementById("dni").value = snap.data().dni
    document.getElementById("name").value = snap.data().fullnameIngCharge

    var canvas2 = document.getElementById('signature-pad2');

    const ctx = canvas2.getContext('2d');
    const img = new Image();

        // Establece la fuente de la imagen (URL de la imagen en internet)
        img.src = snap.data().signatureUrl; // Reemplaza con la URL de la imagen que quieras

        // Una vez que la imagen esté cargada, se dibuja en el canvas
        img.onload = function() {
            // Dibuja la imagen en el canvas, posición (x, y) y tamaño opcional (ancho, alto)
            ctx.drawImage(img, 0, 0, canvas2.width, canvas.height);
            document.getElementById("loader2").style.display = "none"
            document.getElementById("clear").disabled = false
            document.getElementById("save").disabled = false
        };

    

})


document.getElementById('save').addEventListener('click', function() {
    if (signaturePad.isEmpty()) {
        Swal.fire({
            title: "Oops!",
            text: "Por favor, proporciona una firma primero.",
            icon: "warning"
        });
        return;
    }

    document.getElementById("loader2").style.display = "block"
    document.getElementById("clear").disabled = true
    document.getElementById("save").disabled = true


    var dataURL = signaturePad.toDataURL();
    var blob = dataURLToBlob(dataURL);
    var storageRef = storage.ref();
    var signatureRef = storageRef.child('signatures/' + new Date().getTime() + '.png');

    let dni = document.getElementById("dni").value 
    let fullnameIngCharge = document.getElementById("name").value

    signatureRef.put(blob).then(function(snapshot) {
        signatureRef.getDownloadURL().then(function(url) {
            db.collection("config").doc("data").update({
                timestamp: Date.now(),
                dni : dni,
                fullnameIngCharge : fullnameIngCharge,
                signatureUrl: url
            }).then(function(ref) {
                Swal.fire({
                    title: "Muy bien!",
                    text: "Configuración guardada.",
                    icon: "success"
                });
                document.getElementById("loader2").style.display = "none"
                document.getElementById("clear").disabled = false
                document.getElementById("save").disabled = false
            }).catch(function(error) {
                console.error("Error al guardar en Firestore: ", error);
                document.getElementById("loader2").style.display = "none"
                document.getElementById("clear").disabled = false
                document.getElementById("save").disabled = false
            });
        });
    }).catch(function(error) {
        console.error("Error al subir la imagen: ", error);
    });
});


function dataURLToBlob(dataURL) {
    var parts = dataURL.split(';base64,');
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;
    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], {type: contentType});
}