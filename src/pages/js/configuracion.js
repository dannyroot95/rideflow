var canvas = document.getElementById('signature-pad');
var signaturePad = new SignaturePad(canvas);
var storage = firebase.storage();

document.getElementById('clear').addEventListener('click', function() {
    signaturePad.clear();
});


db.collection("config").doc("data").get().then((snap)  => {
    document.getElementById("dni").value = snap.data().dni
    document.getElementById("name").value = snap.data().fullnameIngCharge
})


document.getElementById('save').addEventListener('click', function() {
    if (signaturePad.isEmpty()) {
        alert("Por favor, proporciona una firma primero.");
        return;
    }
    var dataURL = signaturePad.toDataURL();
    var blob = dataURLToBlob(dataURL);
    var storageRef = storage.ref();
    var signatureRef = storageRef.child('signatures/' + new Date().getTime() + '.png');

    let dni = document.getElementById("dni").value 
    let fullnameIngCharge = document.getElementById("name").value

    signatureRef.put(blob).then(function(snapshot) {
        signatureRef.getDownloadURL().then(function(url) {
            db.collection("config").doc("data").update({
                timestamp: new Date(),
                dni : dni,
                fullnameIngCharge : fullnameIngCharge,
                signatureUrl: url
            }).then(function(ref) {
                alert("Guardado.");
            }).catch(function(error) {
                console.error("Error al guardar en Firestore: ", error);
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